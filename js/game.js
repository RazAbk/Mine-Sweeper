// Game consts
const MINE = '<img src="IMG/mine.png"';
const FLAG = '<img src="IMG/flag.png"';
const EMPTY = "";
const COLOROFSHOWN = 'rgb(255, 161, 76)';
const COUNTERS_COLORS = [
  "blue",
  "green",
  "red",
  "darkblue",
  "yellow",
  "purple",
  "orange",
  "cyan",
];

// Global game variables
var gBoard;

var gLevel = {
  level: "Easy",
  size: 4,
  mines: 2,
  lives: 1,
  livesLeft: 1,
  hints: 1,
  safeclicks: 1,
};

var gGame = {
  isOn: false,
  isHint: false,
  shownCount: 0,
  markedCount: 0,
  secsPassed: 0,
};


// Global varaibles 
var gBombIsNotFlagCounter = 0;
var gisManuallyPositionMines = false;
var gManuallyMinesCounter = 0;

var gTimer;
var gElTimer = document.querySelector(".timer");

var gElMsg = document.querySelector(".msg");
var gElEmojiMsg = document.querySelector(".emoji-msg");

var gElLives = document.querySelector(".lives");
var gElHints = document.querySelector(".hints");

var gElSafeClick = document.querySelector(".safe-click");

var gLastStepsIdx = [];
var gUndoTime = false;



// Initialize the game onload or in reset.
function initGame() {
  gBoard = buildBoard();
  gLastSteps = [];

  gGame.isOn = true;
  gGame.isHint = false;
  gGame.shownCount = 0;
  gGame.markedCount = 0;
  gGame.secsPassed = 0;

  gBombIsNotFlagCounter = 0;

  gLevel.livesLeft = gLevel.lives;
  gLevel.hints = 1;
  gLevel.safeclicks = 1;

  gManuallyMinesCounter = 0;

  gLastStepsIdx = [];
  gUndoTime = false;

  gElTimer.innerText = 0 + " sec";
  gElTimer.style.visibility = "hidden";
  clearInterval(gTimer);

  var elImg = document.querySelector(".pos-mines");

  elImg.setAttribute("src", "/IMG/positionmines.png");

  updateCellsCount();
  gElMsg.style.visibility = "hidden";
  gElEmojiMsg.innerText = "😀";

  gElHints.setAttribute("src", "IMG/hintOn.png");
  gElSafeClick.setAttribute("src", "IMG/safeClick.png");

  displayLives();

  spawnMines();
  renderBoard();

  setMinesNegsCount(gBoard);

  hideBoard();

  // For preventing the context menu pop up when right clicked anywhere on the board
  var elBoard = document.querySelector(".board-container");
  elBoard.addEventListener("contextmenu", (e) => e.preventDefault());
}

// Creating the game board with an object describing each cell
function buildBoard() {
  var board = [];

  for (var i = 0; i < gLevel.size; i++) {
    board[i] = [];
    for (var j = 0; j < gLevel.size; j++) {
      board[i][j] = {
        minesAroundCount: EMPTY,
        isShown: false,
        isFirstClicked: false,
        isMine: false,
        isMarked: false,
      };
    }
  }

  return board;
}

// Create gLevel.mines amount of mines, and randomly insert it to the gBoard
function spawnMines() {
  var minesArr = [];

  // Create 1D array with the number of mines and everything else is empty
  for (var i = 0; i < gLevel.size * gLevel.size; i++) {
    if (i < gLevel.mines) {
      minesArr.push(MINE);
    } else {
      minesArr.push(EMPTY);
    }
  }

  // Randomize the array
  minesArr = shuffleArr(minesArr);

  // Insert the 1D array to the 2D matt of gBoard
  var idx = 0;

  for (var i = 0; i < gLevel.size; i++) {
    for (var j = 0; j < gLevel.size; j++) {
      if (minesArr[idx] === MINE) gBoard[i][j].isMine = true;

      idx++;
    }
  }
}

// Give each cell a value according to how many mines is near it
function setMinesNegsCount(gBoard) {
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      if (gBoard[i][j].isMine) continue;
      var cellMinesCount = getMinesCountNearCell(i, j);
      if (cellMinesCount === 0) continue;
      gBoard[i][j].minesAroundCount = cellMinesCount;
      var elCell = document.querySelector(`.cell-${i}-${j}`);

      elCell.innerText = gBoard[i][j].minesAroundCount;
      elCell.style.color = COUNTERS_COLORS[gBoard[i][j].minesAroundCount - 1];
      renderCell(i, j, gBoard[i][j].minesAroundCount);
    }
  }
}

// Returns the amount of mines near a cell
function getMinesCountNearCell(posI, posJ) {
  var counter = 0;
  for (var i = posI - 1; i <= posI + 1; i++) {
    if (i < 0 || i >= gBoard.length) continue;
    for (var j = posJ - 1; j <= posJ + 1; j++) {
      if (j < 0 || j >= gBoard[0].length) continue;
      if (i === posI && j === posJ) continue;
      if (gBoard[i][j].isMine) counter++;
    }
  }

  return counter;
}

// When a cell is clicked
function cellClicked(elCell, posI, posJ) {
  if (!gGame.isOn) return;

  if (!gUndoTime) gLastStepsIdx.push([posI, posJ, "rightClick"]);

  if (gisManuallyPositionMines) {
    if (gManuallyMinesCounter === gLevel.mines) {
      renderBoard();
      setMinesNegsCount(gBoard);
      hideBoard();

      gisManuallyPositionMines = false;
      return;
    }

    gManuallyMinesCounter++;

    gBoard[posI][posJ].isMine = true;

    var elCurrSpanCell = document.querySelector(`.cell.cell-${posI}-${posJ} span`);
    elCurrSpanCell.innerHTML = `<img src="IMG/mine.png"></td>`;
    elCurrSpanCell.style.display = "inline-block";

    return;
  }

  // Start timer for first click
  if (
    gGame.shownCount === 0 &&
    gGame.markedCount === 0 &&
    !gTimer &&
    !gisManuallyPositionMines
  ) {
    gElTimer.style.visibility = "visible";
    gGame.secsPassed++;
    gElTimer.innerText = gGame.secsPassed + " sec";
    gTimer = setInterval(function () {
      gGame.secsPassed++;
      gElTimer.innerText = gGame.secsPassed + " sec";
    }, 1000);
  }

  // Extract the class (cell-i-j) from the cell
  var cellLocation = elCell.classList.item(1);
  // Select the span inside the td.
  var elCellSpan = document.querySelector("." + cellLocation + " span");
  // Expose!
  elCellSpan.style.display = "block";

  // Cannot click marked cell, 2nd time clicked cell , or shown and empty cell
  if (
    gBoard[posI][posJ].isMarked ||
    gBoard[posI][posJ].isFirstClicked ||
    (gBoard[posI][posJ].isShown &&
      gBoard[posI][posJ].minesAroundCount === EMPTY)
  )
    return;

  if (gGame.isHint) {
    useHintOnCell(elCell, posI, posJ);
    gGame.isHint = false;
    return;
  }

  // If clicked a number, reveal all it's 8 close cells
  if (!gBoard[posI][posJ].isFirstClicked && gBoard[posI][posJ].isShown) {
    revealCellsFriends(posI, posJ);
    gBoard[posI][posJ].isFirstClicked = true;
  }

  // Show cell, paint cell darker
  gBoard[posI][posJ].isShown = true;
  elCell.style.backgroundColor = COLOROFSHOWN;

  // Game Over! stepped on Mine
  if (elCellSpan.innerHTML.includes(MINE) && !gUndoTime) {
    // If its the first move of the game - Reset it and cellClick on the same Cell position
    if (gGame.shownCount === 0) {
      initGame();
      elCell = document.querySelector(`.cell-${posI}-${posJ}`);
      cellClicked(elCell, posI, posJ);
    } else {
      elCell.style.backgroundColor = "rgba(256, 0, 0,0.8)";

      // Also mark it only in gBoard, for sake of victory check
      gBoard[posI][posJ].isMarked = true;
      gGame.markedCount++;
      gBombIsNotFlagCounter++;
      gLevel.livesLeft--;
      displayLives();

      if (gLevel.livesLeft < 0) {
        revealAllBombs();
        gameResult(false);
      }
    }
  }

  // Empty cell
  if (elCellSpan.innerHTML === EMPTY) {
    elCell.style.backgroundColor = "rgba(70, 70, 70,0.5)";

    // Reveal Empty cells
    revealEmptyCellAround(posI, posJ);
  }

  updateCellsCount();

  // Check for victory
  if (
    gGame.markedCount === gLevel.mines &&
    gGame.shownCount === gLevel.size * gLevel.size - gLevel.mines
  ) {
    gameResult(true);
  }
}

// Mark / unMark a cell  (right click)
function cellMarked(elCell, posI, posJ) {
  if (!gGame.isOn) return;

  if (!gUndoTime) gLastStepsIdx.push([posI, posJ, "leftClick"]);

  // Start timer for first click
  if (gGame.shownCount === 0 && gGame.markedCount === 0 && !gTimer && !gisManuallyPositionMines) {
    gGame.secsPassed++;
    gElTimer.innerText = gGame.secsPassed + " sec";
    gTimer = setInterval(function () {
      gGame.secsPassed++;
      gElTimer.innerText = gGame.secsPassed + " sec";
    }, 1000);
  }

  if (gBoard[posI][posJ].isShown) return;

  // Remove flag
  if (gBoard[posI][posJ].isMarked) {
    gBoard[posI][posJ].isMarked = false;

    // Print on the cell what's on the gBoard
    var cellContent;
    if (gBoard[posI][posJ].isMine) cellContent = MINE;
    else if (!gBoard[posI][posJ].minesAroundCount) cellContent = EMPTY;
    else cellContent = gBoard[posI][posJ].minesAroundCount;

    elCell.innerHTML = `<span style="display: none">${cellContent}</span>`;
    gGame.markedCount--;

    // Protection
    if(gGame.markedCount < 0) gGame.markedCount = 0;

    // Add Flag
  } else {
    if (gGame.markedCount < gLevel.mines) {
      gBoard[posI][posJ].isMarked = true;
      elCell.innerHTML = `<span style="display: inline-block">${FLAG}</span>`;

      gGame.markedCount++;
    }
  }

  var gGameFlagState = document.querySelector(`.flags`);
  
  gGameFlagState.innerText = gGame.markedCount;

  updateCellsCount();

  // Check for victory
  if (gGame.markedCount === gLevel.mines && gGame.shownCount === gLevel.size * gLevel.size - gLevel.mines) {
    gameResult(true);
  }
}

// Reveal all empty cells & numbers around an empty cell
function revealEmptyCellAround(posI, posJ) {
  for (var i = posI - 1; i <= posI + 1; i++) {
    if (i < 0 || i >= gBoard.length) continue;
    for (var j = posJ - 1; j <= posJ + 1; j++) {
      if (j < 0 || j >= gBoard[0].length) continue;
      if (i === posI && j === posJ) continue;
      if (gBoard[i][j].isShown || gBoard[i][j].isMine || gBoard[i][j].isMarked)
        continue;
      // Paint darker grey
      var elCell = document.querySelector(`.cell-${i}-${j}`);
      if (gBoard[i][j].minesAroundCount === EMPTY) {
        elCell.style.backgroundColor = "rgba(60, 60, 60,0.5)";
      } else {
        elCell.style.backgroundColor = COLOROFSHOWN;
      }
      // Expose!
      var elCellSpan = document.querySelector(`.cell-${i}-${j} span`);
      elCellSpan.style.display = "inline-block";
      // Update gBoard modal
      gBoard[i][j].isShown = true;

      if (gBoard[i][j].minesAroundCount === EMPTY) {
        revealEmptyCellAround(i, j);
      }
    }
  }
}

// Reveal the close cells of an shown number
function revealCellsFriends(posI, posJ) {
  for (var i = posI - 1; i <= posI + 1; i++) {
    if (i < 0 || i >= gBoard.length) continue;
    for (var j = posJ - 1; j <= posJ + 1; j++) {
      if (j < 0 || j >= gBoard[0].length) continue;
      if (i === posI && j === posJ) continue;
      if (gBoard[i][j].isMarked || gBoard[i][j].isShown) continue;

      var elCurrCell = document.querySelector(`.cell-${i}-${j}`);
      gBoard[posI][posJ].isFirstClicked = false;

      cellClicked(elCurrCell, i, j);
    }
  }
}

// What do to if win / lose
function gameResult(isVictory) {
  updateCellsCount();
  gGame.isOn = false;
  clearInterval(gTimer);

  //Win
  gElMsg.style.visibility = "visible";
  if (isVictory) {
    gElMsg.innerHTML = '<img src="IMG/Won.png">';
    gElEmojiMsg.innerText = "😁";

    // Saving the best time and displaying
    var currTime = gGame.secsPassed;
    console.log(currTime);

    // Local storage the result and save if its a new record
    switch (gLevel.level) {
      case "Easy":
        if (
          currTime < localStorage.getItem("bestResult_Easy") ||
          !localStorage.getItem("bestResult_Easy")
        )
          localStorage.setItem("bestResult_Easy", currTime);
        gElTimer.innerText = `\nThe best time for this level is:\n${localStorage.getItem(
          "bestResult_Easy"
        )} Sec`;
        break;
      case "Medium":
        if (
          currTime < localStorage.getItem("bestResult_Medium") ||
          !localStorage.getItem("bestResult_Medium")
        )
          localStorage.setItem("bestResult_Medium", currTime);
        gElTimer.innerText = `\nThe best time for this level is:\n${localStorage.getItem(
          "bestResult_Medium"
        )} Sec`;
        break;
      case "Hard":
        if (
          currTime < localStorage.getItem("bestResult_Hard") ||
          !localStorage.getItem("bestResult_Hard")
        )
          localStorage.setItem("bestResult_Hard", currTime);
        gElTimer.innerText = `\nThe best time for this level is:\n${localStorage.getItem(
          "bestResult_Hard"
        )} Sec`;
        break;
    }
  } else {
    // Lose
    gElMsg.innerHTML = '<img src="IMG/Lost.png">';
    gElEmojiMsg.innerText = "😫";
  }
}

// After initialize, hide all cells on the board
function hideBoard() {
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      var elCell = document.querySelector(`.cell.cell-${i}-${j}`);
      var cellContent = elCell.innerHTML;
      elCell.innerHTML = `<span style="display: none">${cellContent}</span>`;
    }
  }
}

// When lost, reveal all the bombs on the board
function revealAllBombs() {
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      if (
        gBoard[i][j].isMine &&
        !gBoard[i][j].isMarked &&
        !gBoard[i][j].isShown
      ) {
        gBoard[i][j].isShown = true;

        // Select the span inside the td.
        var elCellSpan = document.querySelector(`.cell-${i}-${j} span`);
        // Expose!
        elCellSpan.style.display = "inline-block";

        // Color red the cell
        var elCell = document.querySelector(`.cell-${i}-${j}`);

        elCell.style.backgroundColor = "rgb(256, 0, 0)";
      }
    }
  }
}

// Check how many cells has been checked so far, update the dom and the gBoard
function updateCellsCount() {
  var counter = 0;

  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard.length; j++) {
      // Check if isMine so in a lose situation, dont sum the mines that's been suddenly exposed
      if (gBoard[i][j].isShown && !gBoard[i][j].isMine) counter++;
    }
  }

  gGame.shownCount = counter;

  var elGameCountState = document.querySelector(`.score`);
  elGameCountState.innerText = gGame.shownCount + gGame.markedCount;


  
  var elGameFlagsState = document.querySelector(`.flags`);
  elGameFlagsState.innerText = gGame.markedCount - gBombIsNotFlagCounter;
  if(gGame.markedCount < 0){
    gGameFlagState.innerText = 0;
    gGame.markedCount = 0;
  }
}

// Change the game level by the user's choice
function changeGameLevel(elLevelContainer) {
  var elCurrContainer = document.querySelectorAll(".levels img");

  // Reset all 3 images to the unchosen
  elCurrContainer[0].setAttribute("src", "IMG/Easy.png");
  elCurrContainer[1].setAttribute("src", "IMG/Medium.png");
  elCurrContainer[2].setAttribute("src", "IMG/Hard.png");

  // Chose easy
  if (elLevelContainer.classList.contains("easy-level")) {
    elLevelContainer.setAttribute("src", "IMG/Easy_Chosen.png");
    gLevel = {
      level: "Easy",
      size: 4,
      mines: 2,
      lives: 1,
      livesLeft: 1,
      hints: 1,
    };
    // Chose medium
  } else if (elLevelContainer.classList.contains("medium-level")) {
    elLevelContainer.setAttribute("src", "IMG/Medium_Chosen.png");
    gLevel = {
      level: "Medium",
      size: 8,
      mines: 12,
      lives: 2,
      livesLeft: 2,
      hints: 1,
    };
    // Chose hard
  } else if (elLevelContainer.classList.contains("hard-level")) {
    elLevelContainer.setAttribute("src", "IMG/Hard_Chosen.png");
    gLevel = {
      level: "Hard",
      size: 12,
      mines: 30,
      lives: 3,
      livesLeft: 3,
      hints: 1,
    };
  }

  // Restart the game
  initGame();
}

// Display the life left (hearts)
function displayLives() {
  var strHTML = "";
  for (var i = 0; i < gLevel.livesLeft; i++) {
    strHTML += '<img src="IMG/heart.png">';
  }
  gElLives.innerHTML = strHTML;

}

// Turn on hints mode
function useHint() {
  if (!gGame.isOn) return;

  // If 0, cick off
  if (gLevel.hints === 0) return;

  gLevel.hints--;

  // If 0, show grey
  if (gLevel.hints === 0) {
    gElHints.setAttribute("src", "IMG/hintOff.png");
  }

  gGame.isHint = true;
}

// Apply the logic of Hint on a cell clicked
function useHintOnCell(elCell, posI, posJ) {
  for (var i = posI - 1; i <= posI + 1; i++) {
    if (i < 0 || i >= gBoard.length) continue;
    for (var j = posJ - 1; j <= posJ + 1; j++) {
      if (j < 0 || j >= gBoard[0].length) continue;
      if (gBoard[i][j].isMarked || gBoard[i][j].isShown) continue;

      var elCell = document.querySelector(`.cell-${i}-${j}`);
      var elCurrCellSpan = document.querySelector(`.cell-${i}-${j} span`);

      elCell.style.backgroundColor = "rgba(255,20,20,0.3)";
      elCurrCellSpan.style.display = "block";
    }
  }

  setTimeout(function () {
    for (var i = posI - 1; i <= posI + 1; i++) {
      if (i < 0 || i >= gBoard.length) continue;
      for (var j = posJ - 1; j <= posJ + 1; j++) {
        if (j < 0 || j >= gBoard[0].length) continue;
        if (gBoard[i][j].isMarked || gBoard[i][j].isShown) continue;

        var elNewCell = document.querySelector(`.cell-${i}-${j}`);
        var elNewCurrCellSpan = document.querySelector(`.cell-${i}-${j} span`);

        elNewCell.style.backgroundColor = 'rgb(255, 198, 77)';
        elNewCurrCellSpan.style.display = "none";
      }
    }
  }, 800);
}

// Reveal a safe cell on the board
function safeClick() {
  if (!gGame.isOn) return;

  if (gLevel.safeclicks === 0) return;

  gLevel.safeclicks--;

  if (gLevel.safeclicks === 0) {
    gElSafeClick.setAttribute("src", "IMG/safeClicked.png");
  }

  var randomI = getRandomInt(0, gBoard.length);
  var randomJ = getRandomInt(0, gBoard[0].length);

  while (
    gBoard[randomI][randomJ].isMine ||
    gBoard[randomI][randomJ].isMarked ||
    gBoard[randomI][randomJ].isShown
  ) {
    randomI = getRandomInt(0, gBoard.length);
    randomJ = getRandomInt(0, gBoard[0].length);
  }

  var elCell = document.querySelector(`.cell-${randomI}-${randomJ}`);

  cellClicked(elCell, randomI, randomJ);
}

// Manually position the mines on the board
function manuallyPositionMines() {
  if (!gGame.isOn) return;

  var elImg = document.querySelector(".pos-mines");
  if (elImg.getAttribute("src") === "/IMG/positionminesClicked.png") {
    gisManuallyPositionMines = false;
    initGame();
    return;
  }
  gisManuallyPositionMines = true;

  initGame();

  elImg.setAttribute("src", "/IMG/positionminesClicked.png");

  gBoard = buildBoard();
}

// Undo one step pre click
function undo() {
  if (!gGame.isOn) return;

  // If no more last steps kick out
  if (gLastStepsIdx.length === 0) {
    return;
  }

  // Turn on the undo indicator
  gUndoTime = true;

  gLastStepsIdx.pop();

  // Unshow all cells and unmark all cells
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      gBoard[i][j].isShown = false;
      gBoard[i][j].isMarked = false;
    }
  }

  // Rerender hide, and repaint the cells
  renderBoard();
  setMinesNegsCount(gBoard);
  hideBoard();

  // Reset the flags count
  gGame.markedCount = 0;

  // Loop on the last steps array and redo all the steps until the last step
  for (var i = 0; i < gLastStepsIdx.length; i++) {
    var lastStep = gLastStepsIdx[i];
    var posI = lastStep[0];
    var posJ = lastStep[1];
    var elCell = document.querySelector(`.cell-${posI}-${posJ}`);

    // Send the cellClicked or cellMarked accordingly
    if (lastStep[2] === "leftClick") {
      cellMarked(elCell, posI, posJ);
    } else if (lastStep[2] === "rightClick") {
      cellClicked(elCell, posI, posJ);
    }
  }

  // Update the score and flags count
  var gGameFlagState = document.querySelector(`.flags`);

  
  gGameFlagState.innerText = gGame.markedCount;
  
  if(gGame.markedCount < 0){
    gGameFlagState.innerText = 0;
    gGame.markedCount = 0;
  }

  updateCellsCount();

  // Turn off Undo indicator
  gUndoTime = false;
}
