export default class Landmark {
    constructor(_option) {
        this.canvas = _option.canvas;
        this.landmarks = _option.landmarks;

        this.size = {};
        this.size.width = this.canvas.width;
        this.size.height = this.canvas.height;

        this.ctx = this.canvas.getContext("2d");

        this.getAngles();
        this.smooth();
        this.plot(0);
    }

    getAngles() {
        this.landmarks.forEach(({ positions }, i) => {
            const mouseX = Landmark.shiftX( positions );
            const mouseY = Landmark.shiftY( positions );
            const rotateZ = Landmark.angleZ( positions );
            const mouthOpen = Landmark.mouth( positions );

            this.landmarks[i].angles = { mouseX, mouseY, rotateZ, mouthOpen };
        });
    }

    static shiftX(_pos) {
        const s = Landmark.meanSlop( _pos, [[27, 28], [28, 29], [29, 30]]);

        const disLeft = Landmark.distanceToLine( _pos, 31, { linePoint: 30, slop: s } );
        const disMid = Landmark.distanceToLine( _pos, 33, { linePoint: 30, slop: s } );
        const disRight = Landmark.distanceToLine( _pos, 35, { linePoint: 30, slop: s } );

        const m = [-1, 0, 1];
        const normalized = 1 / disLeft + 1 / disMid + 1 / disRight;
        const mouseX = (m[0] / disLeft + m[1] / disMid + m[2] / disRight) / normalized;

        return mouseX;
    }

    static shiftY(_pos) {
        const normalized = Landmark.distance(_pos[1], _pos[15]);
        const s = Landmark.slop(_pos[1], _pos[15]);
      
        const upDown = s * (_pos[27]._x - _pos[1]._x) - (_pos[27]._y - _pos[1]._y);
        const sign = upDown > 0 ? 1 : -1;

        let mouseY = Landmark.distanceToLine( _pos, 27, { linePoint: 1, slop: s });
        mouseY /= 0.33 * sign * normalized;

        if (mouseY > 1) mouseY = 1;
        if (mouseY < -1) mouseY = -1;
      
        return mouseY;
    }

    static angleZ(_pos) {
        const points = [[0, 16], [1, 15], [2, 14], [3, 13], [4, 12], [5, 11], [6, 10], [7, 9]];
        const s = Landmark.meanSlop( _pos, points );
        const rotateZ = Math.atan(s);

        return rotateZ;
    }

    static mouth(_pos) {
        const mouthWidth = Landmark.distance(_pos[48], _pos[54]);
        const mouthHeight = Landmark.distance(_pos[62], _pos[66]);
        const mouthOpen = mouthHeight / mouthWidth > 0.15 ? true : false;

        return mouthOpen;
    }

    smooth() {
        for (let i = 0; i < 20; i ++) {
            this.landmarks.forEach(({ angles }, i) => {
                if (i === 0 | i === this.landmarks.length - 1) return;
                const Px = this.landmarks[i-1].angles.mouseX;
                const Qx = this.landmarks[i+1].angles.mouseX;            
                const Py = this.landmarks[i-1].angles.mouseY;
                const Qy = this.landmarks[i+1].angles.mouseY;            
                const Pz = this.landmarks[i-1].angles.rotateZ;
                const Qz = this.landmarks[i+1].angles.rotateZ;

                angles.mouseX = angles.mouseX / 2 + (Px + Qx) / 4;
                angles.mouseY = angles.mouseY / 2 + (Py + Qy) / 4;
                angles.rotateZ = angles.rotateZ / 2 + (Pz + Qz) / 4;
            })
        };
    }

    static distance(_pos1, _pos2) {
        const deltaX = _pos1._x - _pos2._x;
        const deltaY = _pos1._y - _pos2._y;
        return Math.sqrt( deltaX * deltaX + deltaY * deltaY);
    }

    static slop(_pos1, _pos2) {
        const deltaX = _pos1._x - _pos2._x;
        const deltaY = _pos1._y - _pos2._y;
        return deltaY / deltaX;
    }

    static meanSlop(_landmarks, points) {
        let slops = 0;
        let count = 0;

        points.forEach( point => {
          const pos1 = _landmarks[ point[0] ];
          const pos2 = _landmarks[ point[1] ];
          slops += Landmark.slop(pos1, pos2);
          count ++;
        });

        return slops /= count;
    }

    static distanceToLine(_landmarks, point, line) {
        const target = _landmarks[ point ];
        const linePoint = _landmarks[ line.linePoint ];
        const lineSlop = line.slop;

        const factor = Math.sqrt(lineSlop * lineSlop + 1);
        const diffX = target._x - linePoint._x;
        const diffY = target._y - linePoint._y;
        const distance = Math.abs( lineSlop * diffX - diffY ) / factor;

        return distance;
    }

    plot(frame) {
        const landmark = this.landmarks[ frame ];
        const ref1 = landmark.positions[2];
        const ref2 = landmark.positions[14];   
        const { mouseX, mouseY, rotateZ, mouthOpen } = landmark.angles;

        const normalized = 0.3 * (this.size.width / (ref2._x - ref1._x));
        const centerX = (ref1._x + ref2._x) / 2;
        const centerY = (ref1._y + ref2._y) / 2;
        const shiftX = centerX * normalized - this.size.width / 2;
        const shiftY = centerY * normalized - this.size.height / 2;

        this.ctx.clearRect(0, 0, this.size.width, this.size.height);
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'black';

        const skip = [17, 22, 27, 36, 42, 48];

        landmark.positions.forEach(({_x, _y}, i) => {
            const x = _x * normalized - shiftX;
            const y = _y * normalized - shiftY;

            if (i === 0) this.ctx.moveTo(x, y);
            if (!skip.includes(i)) this.ctx.lineTo(x, y);
            if (skip.includes(i)) {
                this.ctx.stroke(); 
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
            }
            // this.ctx.fillStyle = 'blue';
            // this.ctx.fillText(i, x, y);
        })
        this.ctx.stroke();

        const mX = (1 + mouseX) * this.size.width / 2;
        const mY = (1 - mouseY) * this.size.height / 2;
        const color =  mouthOpen ? 'red' : 'blue'

        this.ctx.beginPath();
        this.ctx.arc(mX, mY, 6, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(mX, mY);
        this.ctx.lineTo(mX + 20, mY + 20 * rotateZ);
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }
}