window.addEventListener(
  'contextmenu',
  function (e) {
    e.preventDefault();
  },
  false
);

const MINE = '💥';
const FLAG = '🚩';

var gHistory = [];

var gNewScore;
var gTimeDisplay;

var gLevel = { NAME: 'easy', SIZE: 4, MINES: 2 };
var gNonMineCellsCount = gLevel.SIZE ** 2 - gLevel.MINES;
var gBoard;
var gMines = [];
var gIsTimerOn = false;
var gIsHintMode = false;
var gHintsCount = 3;
var gSafeClickCount = 3;
var gIsFreeMode = false;

var gGame = {
  isOn: true,
  lives: 1,
  shownCount: 0,
  markedCount: 0,
  secsPassed: 0,
};

function init() {
  // document.querySelector('.timer').innerText = gGame.secsPassed;
  document.querySelector('.mines-count span').innerText = gLevel.MINES;
  document.querySelector('.lives span').innerText = gGame.lives;
  document.querySelector(
    '.best-score span'
  ).innerText = extractFromLocalStorage('bestScore');
  document.querySelector('.safe-click-count span').innerText = gSafeClickCount;

  gGame.secsPassed = 0;
  gBoard = buildBoard(gLevel.SIZE);
  renderBoard(gBoard, '.board-container');
}

function chooseLevel(levelName) {
  switch (levelName) {
    case 'easy':
      gLevel = { NAME: 'easy', SIZE: 4, MINES: 2 };
      gGame.lives = 1;
      break;
    case 'medium':
      gLevel = { NAME: 'medium', SIZE: 8, MINES: 12 };
      break;
    case 'hard':
      gLevel = { NAME: 'hard', SIZE: 12, MINES: 30 };
      break;
  }
  removeFromLocalStorage('bestScore');
  restart();
}

function buildBoard(size) {
  var board = [];

  for (var i = 0; i < size; i++) {
    board[i] = [];

    for (var j = 0; j < size; j++) {
      var cell = {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false,
      };

      board[i][j] = cell;
    }
  }
  console.log(board);
  return board;
}

function putMines(row, col) {
  for (var i = 0; i < gLevel.MINES; i++) {
    var iPos = getRandomInt(0, gLevel.SIZE);
    var jPos = getRandomInt(0, gLevel.SIZE);
    if (iPos === row && jPos === col) {
      i--;
      continue;
    }
    if (gBoard[iPos][jPos].isMine) i--;
    gBoard[iPos][jPos].isMine = true;
    gMines.push({ i: iPos, j: jPos });
  }
  console.log(gMines);
}

function setMineNegsCount(board) {
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board.length; j++) {
      var cell = board[i][j];
      if (cell.isMine) continue;
      cell.minesAroundCount = countMineNegs({ i: i, j: j });
    }
  }
  return board;
}

function countMineNegs(pos) {
  var counter = 0;
  for (var i = pos.i - 1; i <= pos.i + 1; i++) {
    if (i < 0 || i > gBoard.length - 1) continue;
    for (var j = pos.j - 1; j <= pos.j + 1; j++) {
      if (j < 0 || j > gBoard.length - 1) continue;
      if (i === pos.i && j === pos.j) continue;
      if (gBoard[i][j].isMine) counter++;
    }
  }
  return counter;
}

function renderNegsCells(pos) {
  var negsCellsPos = [];
  negsCellsPos.push({ i: pos.row, j: pos.col });
  for (var i = pos.row - 1; i <= pos.row + 1; i++) {
    if (i < 0 || i > gBoard.length - 1) continue;
    for (var j = pos.col - 1; j <= pos.col + 1; j++) {
      if (j < 0 || j > gBoard.length - 1) continue;
      if (i === pos.row && j === pos.col) continue;
      var cell = gBoard[i][j];
      if (cell.isShown || cell.isMarked) continue;

      cell.isShown = true;
      negsCellsPos.push({ i: i, j: j });
      gGame.shownCount++;
      var elCell = document.querySelector(`.cell-${i}-${j}`);
      elCell.innerHTML = cell.minesAroundCount ? cell.minesAroundCount : '';
      if (elCell.innerHTML === '' && !gIsHintMode) {
        renderNegsCells({ row: i, col: j });
      }
      elCell.classList.add('shown');
    }
  }
  return negsCellsPos;
}

function cellClicked(elCell, i, j) {
  if (!gGame.isOn) return;
  if (gGame.secsPassed === 0) gGame.secsPassed = startTimer();

  var cell = gBoard[i][j];
  if (cell.isMarked) return;
  if (cell.isShown) return;

  if (gIsFreeMode) {
    if (gMines.length === gLevel.MINES) {
      return startFreeMode();
    }
    gMines.push({ i: i, j: j });
    elCell.innerHTML = MINE;
    cell.isMine = true;
  }

  if (!gMines.length && !gIsFreeMode) {
    putMines(i, j);
    setMineNegsCount(gBoard);
  }

  if (gIsHintMode) {
    renderCell(elCell, { i: i, j: j });
    var negsCells = renderNegsCells({ row: i, col: j });
    gIsHintMode = false;
    setTimeout(backFromHintMode, 1000, negsCells);
  }

  if (!gIsFreeMode) {
    renderCell(elCell, { i: i, j: j });
  }

  if (cell.isMine && !gIsHintMode && !gIsFreeMode) {
    gGame.lives--;
    document.querySelector('.lives span').innerText = gGame.lives;
    gLevel.MINES--;
    if (gGame.lives === 0) return gameOver('Game-Over!');
  }

  cell.isShown = true;
  gGame.shownCount++;

  if (!cell.minesAroundCount && !cell.isMine) {
    renderNegsCells({ row: i, col: j });
  }
  if (
    gGame.markedCount === gLevel.MINES &&
    gGame.shownCount === gNonMineCellsCount
  ) {
    gameOver('Victory!');
  }
  gHistory.push({
    lives: gGame.lives,
    shownCount: gGame.shownCount,
    renderedCell: { i, j },
  });
}

function cellMarked(elCell, i, j) {
  if (!gGame.isOn) return;
  if (gGame.secsPassed === 0) gGame.secsPassed = startTimer();
  var cell = gBoard[i][j];
  if (cell.isShown) return;
  if (elCell.innerHTML !== FLAG) {
    cell.isMarked = true;
    elCell.innerHTML = FLAG;
    gGame.markedCount++;
  } else {
    cell.isMarked = false;
    elCell.innerHTML = '';
    gGame.markedCount--;
  }
  if (
    gGame.markedCount === gLevel.MINES &&
    gGame.shownCount === gNonMineCellsCount
  ) {
    gameOver('Victory!');
  }
  gHistory.push({ markedCount: gGame.markedCount, markedCell: { i, j } });
}

function renderCell(elCell, pos) {
  cell = gBoard[pos.i][pos.j];
  if (cell.isMine === true) {
    cell.isShown = true;
    elCell.innerText = MINE;
  } else {
    elCell.innerText = cell.minesAroundCount ? cell.minesAroundCount : '';
  }
  elCell.classList.add('shown');
}

function renderAllMines() {
  for (var i = 0; i < gMines.length; i++) {
    var row = gMines[i].i;
    var col = gMines[i].j;
    gBoard[row][col].isShown = true;
    var elCell = document.querySelector(`.cell-${row}-${col}`);
    elCell.classList.add('shown');
    elCell.innerHTML = MINE;
  }
}

function backFromHintMode(negsCellsPos) {
  for (var i = 0; i < negsCellsPos.length; i++) {
    var row = negsCellsPos[i].i;
    var col = negsCellsPos[i].j;
    gBoard[row][col].isShown = false;
    elNegCell = document.querySelector(`.cell-${row}-${col}`);
    elNegCell.classList.remove('shown');
    elNegCell.innerHTML = '';
  }
  var hint = document.querySelector(`.hints [data-id="${gHintsCount}"]`);
  hint.style.display = 'none';
  gHintsCount--;
}

function getHint(hints) {
  if (!gHintsCount || gIsHintMode) return;
  var hint = hints.querySelector(`[data-id="${gHintsCount}"]`);
  gIsHintMode = true;
  hint.style.filter = 'invert(100%)';

  gHistory.push({ hintsCount: gHintsCount });
}

function safeClick() {
  if (!gIsTimerOn) return;
  if (!gSafeClickCount) return;
  gSafeClickCount--;
  document.querySelector('.safe-click-count span').innerText = gSafeClickCount;

  var safeCellsPos = [];
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard.length; j++) {
      var currCell = gBoard[i][j];
      if (!currCell.isShown && !currCell.isMine)
        safeCellsPos.push({ i: i, j: j });
    }
  }
  var safeCellIdx = safeCellsPos.splice(
    getRandomInt(0, safeCellsPos.length),
    1
  );

  var elSafeCell = document.querySelector(
    `.cell-${safeCellIdx[0].i}-${safeCellIdx[0].j}`
  );
  elSafeCell.classList.add('safe-cell');

  setTimeout(function () {
    elSafeCell.classList.remove('safe-cell');
  }, 1000);

  gHistory.push({
    safeClick: gSafeClickCount + 1,
  });
}

function undo() {
  var lastMove = gHistory.pop();

  if (lastMove.lives) {
    gGame.lives = lastMove.lives;
    document.querySelector('.lives span').innerText = gGame.lives;
  }

  if (lastMove.shownCount) {
    gGame.shownCount = lastMove.shownCount;
  }

  if (lastMove.safeClick) {
    gSafeClickCount = lastMove.safeClick;
    document.querySelector(
      '.safe-click-count span'
    ).innerText = gSafeClickCount;
  }

  if (lastMove.markedCell) {
    gGame.markedCount = lastMove.markedCount;
    var iPos = lastMove.markedCell.i;
    var jPos = lastMove.markedCell.j;

    var markedCell = gBoard[(iPos, jPos)];
    markedCell.isMarked = false;
    elMarkedCell = document.querySelector(`.cell-${iPos}-${jPos}`);
    elMarkedCell.innerHTML = '';
  }

  if (lastMove.renderedCell) {
    gGame.shownCount = lastMove.shownCount;
    var iPos = lastMove.renderedCell.i;
    var jPos = lastMove.renderedCell.j;
    var renderedCell = gBoard[iPos][jPos];

    renderedCell.minesAroundCount = countMineNegs({ i: iPos, j: jPos });
    renderedCell.isShown = false;
    elRenderedCell = document.querySelector(`.cell-${iPos}-${jPos}`);
    elRenderedCell.classList.remove('shown');
    elRenderedCell.innerText = '';

    if (!renderedCell.minesAroundCount && !renderedCell.isMine) {
      renderBackNegsCells({ row: iPos, col: jPos });
    }
  }

  if (lastMove.hintsCount) {
    gHintsCount = lastMove.hintsCount;
    document.querySelector(
      '.hints'
    ).innerHTML += `<span data-id="${gHintsCount}"> <img src="img/hint.png"></span>`;
  }
}

function renderBackNegsCells(pos) {
  var negsCellsPos = [];
  negsCellsPos.push({ i: pos.row, j: pos.col });
  for (var i = pos.row - 1; i <= pos.row + 1; i++) {
    if (i < 0 || i > gBoard.length - 1) continue;
    for (var j = pos.col - 1; j <= pos.col + 1; j++) {
      if (j < 0 || j > gBoard.length - 1) continue;
      if (i === pos.row && j === pos.col) continue;
      var cell = gBoard[i][j];
      if (!cell.isShown) continue;
      cell.minesAroundCount = countMineNegs({ i: i, j: j });
      gGame.shownCount--;
      cell.isShown = false;
      var elCell = document.querySelector(`.cell-${i}-${j}`);
      elCell.innerHTML = '';
      elCell.classList.remove('shown');

      if (!cell.minesAroundCount) {
        renderBackNegsCells({ row: i, col: j });
      }
    }
  }
}

function gameOver(result) {
  stopTimer();
  var modal = document.querySelector('.modal-container');
  var smiley = document.querySelector('.game-starter');
  if (result === 'Victory!') {
    smiley.innerText = '😍';
    checkBestScore();
  } else {
    renderAllMines();
    smiley.innerText = '😢';
  }

  modal.querySelector('.result').innerText = result;
  modal.style.display = 'block';
  gIsFreeMode = false;
  gGame.isOn = false;
}

function restart() {
  document.querySelector('.modal-container').style.display = 'none';
  var smiley = document.querySelector('.game-starter');
  document.querySelector('.hints').innerHTML =
    'hints: <span data-id="1"><img src="img/hint.png"></span>   <span data-id="2"><img src="img/hint.png"></span>   <span data-id="3"><img src="img/hint.png"></span>';
  smiley.innerText = '😀';
  gGame.shownCount = 0;
  gGame.markedCount = 0;
  gGame.isOn = true;
  gGame.lives = gLevel.SIZE === 4 ? 1 : 3;
  gHintsCount = 3;
  gSafeClickCount = 3;
  if (gIsTimerOn) stopTimer();
  gGame.secsPassed = 0;
  document.querySelector('.timer').innerText = '00:00:00';
  gHistory = [];
  gMovesCount = 0;

  var minesForLevelMap = {
    easy: 2,
    medium: 12,
    hard: 30,
  };
  gLevel.MINES = minesForLevelMap[gLevel.NAME];

  if (!gIsFreeMode) {
    gMines = [];
    init();
  }
}

function freeMode() {
  restart()
  gIsFreeMode = true;
}

function startFreeMode() {
  for (var k = 0; k < gMines.length; k++) {
    var cell = gBoard[gMines[k].i][gMines[k].j];
    cell.isShown = false;
    var elCell = document.querySelector(`.cell-${gMines[k].i}-${gMines[k].j}`);
    elCell.innerText = '';
  }
  setMineNegsCount(gBoard);
  restart();
  gIsFreeMode = false;
}