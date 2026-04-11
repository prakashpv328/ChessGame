window.onload = function () {
  const boardEl = document.getElementById("board");

  const IMG = {
  wK:"pieces/white/king.png", wQ:"pieces/white/queen.png", wR:"pieces/white/rook.png", wB:"pieces/white/bishop.png", wN:"pieces/white/knight.png", wP:"pieces/white/pawn.png",
  bK:"pieces/black/king.png", bQ:"pieces/black/queen.png", bR:"pieces/black/rook.png", bB:"pieces/black/bishop.png", bN:"pieces/black/knight.png", bP:"pieces/black/pawn.png"
};

  function p(color,type){ return {color,type}; }

  function createStartBoard(){
    const b = Array.from({length:8},()=>Array(8).fill(null));

    b[0] = [p("b","R"),p("b","N"),p("b","B"),p("b","Q"),p("b","K"),p("b","B"),p("b","N"),p("b","R")];
    b[1] = Array.from({length:8},()=>p("b","P"));

    b[6] = Array.from({length:8},()=>p("w","P"));
    b[7] = [p("w","R"),p("w","N"),p("w","B"),p("w","Q"),p("w","K"),p("w","B"),p("w","N"),p("w","R")];

    return b;
  }

  const board = createStartBoard();

  function drawBoard(){
    boardEl.innerHTML = "";

    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        const sq = document.createElement("div");
        sq.className = "square " + ((r+c)%2===0 ? "light" : "dark");

        const piece = board[r][c];
        if(piece){
          const img = document.createElement("img");
          img.className = "piece";
          img.src = IMG[piece.color + piece.type];
          img.alt = piece.color + piece.type;
          sq.appendChild(img);
        }

        boardEl.appendChild(sq);
      }
    }
  }

  drawBoard();
};