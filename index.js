class Ship {
  static UNDAMAGED = 1;
  static TOUCHED = 2;
  static SUNKEN = 3;

  constructor(id, name, length) {
    this.id = id;
    this.name = name;
    this.length = length;
    this.position = { r: null, c: null, align: null };
    this.damages = [];
    for (let i = 0; i < this.length; i++) {
      this.damages[i] = Ship.UNDAMAGED;
    }
  }

  shoot = (r, c) => {
    let pieceTouched;
    if (this.position.align === "-") {
      pieceTouched = c - this.position.c;
    } else {
      pieceTouched = r - this.position.r;
    }
    this.damages[pieceTouched] = Ship.TOUCHED;
    if (this.damages.every(value => value === Ship.TOUCHED)) {
      for (let i = 0; i < this.length; i++) {
        this.damages[i] = Ship.SUNKEN;
      }
    }
    return this.damages[pieceTouched];
  };
}

class Board {
  static SEA_STATUS_NOT_TESTED = -1;
  static SEA_STATUS_FREE = 0;
  static SEA_STATUS_UNDAMAGED = Ship.UNDAMAGED;
  static SEA_STATUS_TOUCHED = Ship.TOUCHED;
  static SEA_STATUS_SUNKEN = Ship.SUNKEN;

  constructor($el) {
    this.rows = 8;
    this.cols = 8;
    this.ships = [];
    for (let r = 1; r <= this.rows; r++) {
      $el.append(`<div id="row-${r}" class="row"></div>`);
      for (let c = 1; c <= this.cols; c++) {
        $(`#row-${r}`).append(
          `<div id="cell-${r}-${c}" class="cell" onclick="shoot(${r},${c})"></div>`
        );
        // $(`#cell-${r}-${c}`).append("<p>X</p>");
      }
    }
  }

  calculate = () => {
    const sea = [];
    for (let r = 1; r <= this.rows; r++) {
      sea[r] = [];
      for (let c = 1; c <= this.cols; c++) {
        sea[r][c] = { status: Board.SEA_STATUS_FREE, ship: null };
      }
    }
    for (const ship of this.ships) {
      for (let i = 0; i < ship.length; i++) {
        const r = ship.position.r + (ship.position.align === "|" ? i : 0);
        const c = ship.position.c + (ship.position.align === "-" ? i : 0);
        sea[r][c] = { status: ship.damages[i], ship };
      }
    }
    return sea;
  };

  shootIn = (r, c) => {
    const sea = this.calculate();
    const { status, ship } = sea[r][c];
    if (status !== Board.SEA_STATUS_UNDAMAGED) {
      return status;
    }
    return ship.shoot(r, c);
  };

  refresh = () => {
    const sea = this.calculate();
    sea.forEach((row, rowIndex) => {
      row.forEach((cellValue, colIndex) => {
        const $cell = $(`#cell-${rowIndex}-${colIndex}`);
        switch (cellValue.status) {
          case Board.SEA_STATUS_NOT_TESTED:
            $cell.css("background", "white");
            $cell.html("");
            break;
          case Board.SEA_STATUS_FREE:
            $cell.css("background", "blue");
            $cell.html("");
            break;
          case Board.SEA_STATUS_UNDAMAGED:
            $cell.css("background", "green");
            $cell.html("");
            break;
          case Board.SEA_STATUS_TOUCHED:
            $cell.css("background", "yellow");
            $cell.html("");
            break;
          case Board.SEA_STATUS_SUNKEN:
            $cell.css("background", "red");
            $cell.html("");
            break;
        }
      });
    });
  };
}

const board = new Board($("#board"));

function shoot(r, c) {
  board.shootIn(r, c);
  board.refresh();
}

function start() {
  board.ships = [
    new Ship(0, "destroyer", 2),
    new Ship(1, "submarine", 3),
    new Ship(2, "cruiser", 3),
    new Ship(3, "battleship", 4),
    new Ship(4, "carrier", 5),
  ];
  board.ships[0].position = { r: 1, c: 1, align: "-" };
  board.ships[1].position = { r: 2, c: 1, align: "|" };
  board.ships[2].position = { r: 5, c: 2, align: "-" };
  board.ships[3].position = { r: 8, c: 1, align: "-" };
  board.ships[4].position = { r: 4, c: 8, align: "|" };
  board.refresh();
}
