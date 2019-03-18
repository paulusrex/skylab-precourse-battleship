class Ship {
  static UNDAMAGED = 2;
  static TOUCHED = 3;
  static SUNKEN = 4;

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

class BoardWidget {
  colors = ["white", "blue", "green", "yellow", "red"];

  constructor($el, board) {
    this.boardId = $el.attr("id");
    this.board = board;
    for (let r = 1; r <= board.rows; r++) {
      $el.append(`<div id="${this.boardId}__row-${r}" class="row"></div>`);
      for (let c = 1; c <= board.cols; c++) {
        $(`#${this.boardId}__row-${r}`).append(
          `<div id="${
            this.boardId
          }__cell-${r}-${c}" class="cell" onclick="shoot(${r},${c}, '${
            board.playerType
          }')"></div>`
        );
      }
    }
  }

  refresh = () => {
    const { boardId, colors } = this;
    this.board.sea.forEach((row, rowIndex) => {
      row.forEach((cellValue, colIndex) => {
        $(`#${boardId}__cell-${rowIndex}-${colIndex}`).css(
          "background",
          colors[cellValue.status]
        );
      });
    });
  };
}

class Board {
  static SEA_STATUS_NOT_TESTED = 0;
  static SEA_STATUS_FREE = 1;
  static SEA_STATUS_UNDAMAGED = Ship.UNDAMAGED;
  static SEA_STATUS_TOUCHED = Ship.TOUCHED;
  static SEA_STATUS_SUNKEN = Ship.SUNKEN;

  static WITH_SHIPS = "WITH_SHIPS";
  static OPPONENT = "opponent";

  constructor(playerType) {
    this.rows = 8;
    this.cols = 8;
    this.ships = [];
    this.playerType = playerType;
    this.reset();
  }

  reset = () => {
    this.sea = [];
    for (let r = 1; r <= this.rows; r++) {
      this.sea[r] = [];
      for (let c = 1; c <= this.cols; c++) {
        this.sea[r][c] = { status: Board.SEA_STATUS_NOT_TESTED, ship: null };
      }
    }
    return this.updateShipsInSea();
  };

  updateShipsInSea = () => {
    for (const ship of this.ships) {
      for (let i = 0; i < ship.length; i++) {
        const r = ship.position.r + (ship.position.align === "|" ? i : 0);
        const c = ship.position.c + (ship.position.align === "-" ? i : 0);
        this.sea[r][c] = { status: ship.damages[i], ship };
      }
    }
    return this.sea;
  };

  canIPutThisShip(ship) {
    for (let i = 0; i < ship.length; i++) {
      const r = ship.position.r + (ship.position.align === "|" ? i : 0);
      const c = ship.position.c + (ship.position.align === "-" ? i : 0);
      if (r > this.rows || c > this.cols) {
        return false;
      }
      const { status } = this.sea[r][c];
      if (status !== Board.SEA_STATUS_NOT_TESTED) {
        return false;
      }
    }
    return true;
  }

  deployShips = ships => {
    this.ships = [];
    let i = 0;
    while (i < ships.length) {
      const ship = ships[i];
      const { position } = ship;
      position.r = Math.floor(Math.random() * this.rows) + 1;
      position.c = Math.floor(Math.random() * this.cols) + 1;
      position.align = Math.random() < 0.5 ? "-" : "|";
      if (this.canIPutThisShip(ship)) {
        this.ships.push(ship);
        this.updateShipsInSea();
        i++;
      }
    }
    this.reset();
  };

  shootIn = (r, c) => {
    const { sea } = this;
    switch (sea[r][c].status) {
      case Board.SEA_STATUS_NOT_TESTED:
        sea[r][c].status = Board.SEA_STATUS_FREE;
      case Board.SEA_STATUS_FREE:
        break;
      default:
        sea[r][c].status = sea[r][c].ship.shoot(r, c);
    }
    return sea[r][c].status;
  };
}

const baseFleet = () => [
  new Ship(0, "destroyer", 2),
  new Ship(1, "submarine", 3),
  new Ship(2, "cruiser", 3),
  new Ship(3, "battleship", 4),
  new Ship(4, "carrier", 5),
];
const boardMe = new Board(Board.WITH_SHIPS);
const boardComputer = new Board(Board.WITH_SHIPS);
const boardOpponent = new Board(Board.OPPONENT);
const boardWidgetMe = new BoardWidget($("#boardMe"), boardMe);
const boardWidgetOpponent = new BoardWidget($("#boardOpponent"), boardOpponent);

function shootRandom(board) {
  const r = Math.floor(Math.random() * board.rows) + 1;
  const c = Math.floor(Math.random() * board.cols) + 1;
  return board.shootIn(r, c);
}

function shoot(r, c, player) {
  if (player === "opponent") {
    boardOpponent.sea[r][c].status = boardComputer.shootIn(r, c);
    boardWidgetOpponent.refresh();
    shootRandom(boardMe);
    boardWidgetMe.refresh();
  }
}

function start() {
  $("#myName").text($("#player-name").val());
  $("#intro").css("display", "none");
  boardMe.deployShips(baseFleet());
  boardComputer.deployShips(baseFleet());
  boardWidgetMe.refresh();
  boardWidgetOpponent.refresh();
}
