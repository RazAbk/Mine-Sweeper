// Utilities functions


// Renders a board to a table in HTML
function renderBoard() {
  var strHTML = '<table border="0">\n<tbody>';

  for (var i = 0; i < gLevel.size; i++) {
    strHTML += "\n<tr>";
    for (var j = 0; j < gLevel.size; j++) {
      var currCell = gBoard[i][j].minesAroundCount;
      if (gBoard[i][j].isMine) currCell = MINE;
      var className = `cell cell-${i}-${j}`;
      strHTML += `\t<td onclick="cellClicked(this,...extractPos(this))" oncontextmenu="cellMarked(this,...extractPos(this))" class="${className}">${currCell}</td>\n`;
    }
    strHTML += "</tr>\n";
  }

  strHTML += "</tbody>\n</table>";

  var elContainer = document.querySelector(".board-container");
  elContainer.innerHTML = strHTML;
}

// Render a specific cell according to i , j and a value for innerHTML
function renderCell(i, j, value) {
  var elCell = document.querySelector(`.cell-${i}-${j}`);
  elCell.innerHTML = value;
}

// Checks if the cell is valid, returns true / false
function isValidCell(i, j) {
  if (i >= 0 && i < gBoard.length && j >= 0 && j < gBoard[0].length) {
    return true;
  }
  return false;
}

// Gets an Cell element from the dom and extract the i,j of the cell, returns in an [i,j] array
function extractPos(elCell) {
  // Extract the class (cell-i-j) from the cell
  var cellLocation = elCell.classList.item(1);

  // Extract i and j from the elCell
  var cellPositions = cellLocation;
  cellPositions = cellPositions.substring(5, 10);
  cellPositions = cellPositions.split("-");

  var posI = parseInt(cellPositions[0]);
  var posJ = parseInt(cellPositions[1]);

  return [posI, posJ];
}

//////////////////////////////////////////////////////////////////////////////////////
//                              General functions                                   //
//////////////////////////////////////////////////////////////////////////////////////


// Get random integer between min and max (exclusive of max)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Shuffle an 1D array
function shuffleArr(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = getRandomInt(0, i + 1);
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
}
