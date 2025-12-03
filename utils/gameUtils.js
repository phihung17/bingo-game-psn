/**
 * Count the number of completed lines (rows, columns, diagonals) in a bingo board
 * @param {Array<Array<{number: number, isMarked: boolean}>>} board - 5x5 bingo board
 * @returns {number} number of completed lines
 */
const countCompletedLines = (board) => {
  if (!board || board.length === 0) return 0;

  let completedLines = 0;

  // Check horizontal lines (rows)
  for (let i = 0; i < 5; i++) {
    if (board[i]?.every((cell) => cell.isMarked)) {
      completedLines++;
    }
  }

  // Check vertical lines (columns)
  for (let j = 0; j < 5; j++) {
    if (board.every((row) => row[j]?.isMarked)) {
      completedLines++;
    }
  }

  // Check main diagonal (top-left to bottom-right)
  if (board.every((row, i) => row[i]?.isMarked)) {
    completedLines++;
  }

  // Check anti-diagonal (top-right to bottom-left)
  if (board.every((row, i) => row[4 - i]?.isMarked)) {
    completedLines++;
  }

  return completedLines;
};

/**
 * Check if a board has won (5 or more completed lines)
 * @param {Array<Array<{number: number, isMarked: boolean}>>} board - 5x5 bingo board
 * @returns {boolean} true if board has won
 */
const checkWin = (board) => {
  return countCompletedLines(board) >= 5;
};

module.exports = {
  countCompletedLines,
  checkWin,
};
