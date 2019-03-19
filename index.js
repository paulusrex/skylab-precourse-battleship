class Ship {
  static UNDAMAGED = 2;
  static TOUCHED = 3;
  static SUNKEN = 4;

  constructor({ id, name, length }) {
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
class DeployShips {
  cellSize = 40;
  constructor(board, fleet) {
    this.board = board;
    this.fleet = fleet;
  }

  deployShipsRandom = () => {
    const { board } = this;
    let i = 0;
    while (i < this.fleet.length) {
      const ship = this.fleet[i];
      const { position } = ship;
      position.r = Math.floor(Math.random() * board.rows) + 1;
      position.c = Math.floor(Math.random() * board.cols) + 1;
      position.align = Math.random() < 0.5 ? "-" : "|";
      if (board.canIPutThisShip(ship)) {
        board.ships.push(ship);
        board.updateShipsInSea();
        i++;
      }
    }
    board.reset();
  };

  dragStart(e, ship, align) {
    const { offsetX, offsetY } = e.originalEvent;
    const dragPiece = Math.floor((align === "-" ? offsetX : offsetY) / 40);
    e.originalEvent.dataTransfer.setData("align", align);
    e.originalEvent.dataTransfer.setData("dragPiece", dragPiece);
    e.originalEvent.dataTransfer.setData("ship", JSON.stringify(ship));
    e.originalEvent.dataTransfer.setData(
      "idShipDragged",
      e.originalEvent.target.id
    );
  }

  showShipsToDrag($elHorizontal, $elVertical) {
    const { cellSize } = this;
    for (const ship of this.fleet) {
      $elVertical.append(
        `<div 
            id="ship-v-${ship.id}"
            class="ship" 
            draggable="true" 
            style="width:${cellSize}px;height:${cellSize * ship.length}px;">
         </div>`
      );
      $elHorizontal.append(
        `<div 
            id="ship-h-${ship.id}"
            class="ship" 
            draggable="true" 
            style="width:${cellSize * ship.length}px;height:${cellSize}px;">
         </div>`
      );
      $(`#ship-v-${ship.id}`).on("dragstart", e =>
        this.dragStart(e, ship, "|")
      );
      $(`#ship-h-${ship.id}`).on("dragstart", e =>
        this.dragStart(e, ship, "-")
      );
    }
  }
}
class BoardWidget {
  colors = ["white", "blue", "green", "yellow", "red"];

  constructor($el, board) {
    this.boardId = $el.attr("id");
    this.$el = $el;
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
        const $cell = $(`#${this.boardId}__cell-${r}-${c}`);
        $cell.on("dragover", this.allowDrop);
        $cell.on("drop", this.drop);
      }
    }
  }

  extractDataEvent = e => {
    const ship = new Ship(
      JSON.parse(e.originalEvent.dataTransfer.getData("ship"))
    );
    const align = e.originalEvent.dataTransfer.getData("align");
    const dragPiece = parseInt(
      e.originalEvent.dataTransfer.getData("dragPiece")
    );
    const idShipDragged = e.originalEvent.dataTransfer.getData("idShipDragged");
    const targetId = e.originalEvent.target.id;
    const r_c = targetId.split("cell-")[1].split("-");
    const r = parseInt(r_c[0]);
    const c = parseInt(r_c[1]);
    ship.position.r = r - (align === "|" ? dragPiece : 0);
    ship.position.c = c - (align === "-" ? dragPiece : 0);
    ship.position.align = align;
    return { ship, align, dragPiece, r, c, idShipDragged };
  };

  allowDrop = e => {
    e.preventDefault();
  };

  drop = e => {
    e.preventDefault();
    const { ship, idShipDragged } = this.extractDataEvent(e);
    let altIdShipDragged = idShipDragged.split("-");
    altIdShipDragged[1] = altIdShipDragged[1] === "h" ? "v" : "h";
    altIdShipDragged = altIdShipDragged.join("-");
    const { board } = this;
    if (board.canIPutThisShip(ship)) {
      board.ships.push(ship);
      board.updateShipsInSea();
      console.log(idShipDragged);
      $(`#${idShipDragged}`).css("visibility", "hidden");
      $(`#${altIdShipDragged}`).css("visibility", "hidden");
      this.refresh();
    }
  };

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
    if (
      ship.position.r < 1 ||
      ship.position.r > this.rows ||
      ship.position.c < 1 ||
      ship.position.c > this.cols
    ) {
      return false;
    }
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
  new Ship({ id: 0, name: "destroyer", length: 2 }),
  new Ship({ id: 1, name: "submarine", length: 3 }),
  new Ship({ id: 2, name: "cruiser", length: 3 }),
  new Ship({ id: 3, name: "battleship", length: 4 }),
  new Ship({ id: 4, name: "carrier", length: 5 }),
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
  $("#container-ships").css("display", "none");
  $("#container-opponent").css("display", "block");
  new DeployShips(boardComputer, baseFleet()).deployShipsRandom();
  boardWidgetMe.refresh();
  boardWidgetOpponent.refresh();
}

const deploy = new DeployShips(boardMe, baseFleet());
deploy.showShipsToDrag($("#ships-horizontal"), $("#ships-vertical"));
