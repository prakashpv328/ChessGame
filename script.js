window.onload = function () {
    const boardEl = document.getElementById("board");
    const statusEl= document.getElementById("status");
    const movesEl=document.getElementById("moves");
    const capturedByWhiteEl=document.getElementById("capturedByWhite");
    const capturedByBlackEl=document.getElementById("capturedByBlack");

    const IMG = {
        wK:"pieces/white/king.png",wQ:"pieces/white/queen.png",wR:"pieces/white/rook.png",wB:"pieces/white/bishop.png",wN:"pieces/white/knight.png",wP:"pieces/white/pawn.png",
        bK:"pieces/black/king.png",bQ:"pieces/black/queen.png",bR:"pieces/black/rook.png",bB:"pieces/black/bishop.png",bN:"pieces/black/knight.png",bP:"pieces/black/pawn.png"
    };

    function p(color,type){ 
        return {color,type}; 
    }

    const files=["a","b","c","d","e","f","g","h"];
    const inBoard=(r,c)=>r>=0 && r<8 && c>=0 && c<8;
    const enemyOf=(color)=>color==="w"?"b":"w";
    const squareName=(r,c)=>files[c]+(8-r);

    function createStartBoard(){
        const b = Array.from({length:8},()=>Array(8).fill(null));

        b[0]=[p("b","R"),p("b","N"),p("b","B"),p("b","Q"),p("b","K"),p("b","B"),p("b","N"),p("b","R")];
        b[1]=Array.from({length:8},()=>p("b","P"));

        b[6]=Array.from({length:8},()=>p("w","P"));
        b[7]=[p("w","R"),p("w","N"),p("w","B"),p("w","Q"),p("w","K"),p("w","B"),p("w","N"),p("w","R")];

        return b;
    }

    const game={
        board:createStartBoard(),
        turn:"w",
        selected:null,
        legalMoves:[],
        capturedByWhite:[],
        capturedByBlack:[],
        moveList:[]
    };

    function getPseudoMoves(r,c){
        const board=game.board;
        const piece=board[r][c];
        if(!piece) return [];

        const me=piece.color;
        const enemy=enemyOf(me);
        const moves=[];

        if(piece.type=="P"){
            const dir=me==="w"?-1:1;
            const startRow=me==="w"?6:1;

            const r1=r+dir;
            if(inBoard(r1,c) && !board[r1][c]){
                moves.push({
                    from:{r,c},
                    to:{r:r1,c}
                });
                const r2=r+2*dir;

                if(r===startRow && !board[r2][c]){
                    moves.push({from:{r,c},to:{r:r2,c}})
                }
            }

            for(const dc of [-1,1]){
                const rr=r+dir,cc=c+dc;
                if(inBoard(rr,cc) && board[rr][cc] && board[rr][cc].color===enemy){
                    moves.push({from:{r,c},to:{r:rr,c:cc},capture:true})
                }
            }
        }

        if(piece.type==="N"){
            const jumps=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
            for(const [dr,dc] of jumps){
                const rr=r+dr;
                const cc=c+dc;
                if(!inBoard(rr,cc)) continue;
                if(!board[rr][cc] || board[rr][cc].color!==me){
                    moves.push({from:{r,c},to:{r:rr,c:cc},capture:!!board[rr][cc]});
                }
            }
        }

        if(piece.type==="B" || piece.type==="R" || piece.type==="Q"){
            const dirs=[];

            if(piece.type==="B" || piece.type==="Q"){
                dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
            }
            if(piece.type==="R" || piece.type==="Q"){
                dirs.push([-1,0],[0,-1],[0,1],[1,0]);
            }

            for(const [dr,dc] of dirs){
                let rr=r+dr;
                let cc=c+dc;

                while(inBoard(rr,cc)){
                    if(!board[rr][cc]){
                        moves.push({from:{r,c},to:{r:rr,c:cc}});
                    }
                    else{
                        if(board[rr][cc].color!==me){
                            moves.push({from:{r,c},to:{r:rr,c:cc},capture:true});
                        }
                        break;
                    }
                    rr+=dr;
                    cc+=dc;
                }
            }
        }

        if(piece.type==="K"){
            for(let dr=-1;dr<=1;dr++){
                for(let dc=-1;dc<=1;dc++){
                    if(dr===0 && dc===0) continue;
                    const rr=r+dr;
                    const cc=c+dc;
                    if(!inBoard(rr,cc)) continue;
                    if(!board[rr][cc] || board[rr][cc].color!==me){
                        moves.push({from:{r,c},to:{r:rr,c:cc},capture:!!board[rr][cc]});
                    }  
                }
            }
        }

        return moves;

    }

    function pieceIconHtml(color,type){
        return `<img class="move-piece-icon" src="${IMG[color+type]}" alt="${color+type}"/>`;
    }

    function getSimpleMoveText(piece,move){
        const to =squareName(move.to.r,move.to.c);
        const letter=piece.type==="P"?"":piece.type;
        const take=move.capture?"x":"";
        return letter+take+to;
    }

    function makeMove(move){
        const b=game.board;
        const movingPiece=b[move.from.r][move.from.c];
        const targetPiece=b[move.to.r][move.to.c];

        game.moveList.push({
            icon :pieceIconHtml(movingPiece.color,movingPiece.type),
            text:getSimpleMoveText(movingPiece,move)
        });

        if(targetPiece){
            if(targetPiece.color==="w") game.capturedByWhite.push(targetPiece);
            else game.capturedByBlack.push(targetPiece);
        }

        b[move.to.r][move.to.c]=movingPiece;
        b[move.from.r][move.from.c]=null;

        game.turn=enemyOf(game.turn);
        game.selected=null;
        game.legalMoves=[];
    }

    function isSameMove(a,b){
      return a.from.r===b.from.r && a.from.c===b.from.c && a.to.r===b.to.r && a.to.c===b.to.c;
    }

    function onSquareClick(e){
        const r=Number(e.currentTarget.dataset.r);
        const c=Number(e.currentTarget.dataset.c);
        const clickedPiece=game.board[r][c];

        if(game.selected){
            const chosen=game.legalMoves.find(m=>m.to.r===r && m.to.c===c);
            if(chosen){
                makeMove(chosen);
                drawBoard();
                return;
            }
        }

        if(clickedPiece && clickedPiece.color===game.turn){
            game.selected={r,c};
            game.legalMoves=getPseudoMoves(r,c);
        }
        else{
            game.selected=null;
            game.legalMoves=[];
        }
        drawBoard();
    }

    function drawCapturedPieces(){
        capturedByWhiteEl.innerHTML="";
        capturedByBlackEl.innerHTML="";

        game.capturedByWhite.forEach(pc=>{
            const img=document.createElement("img");
            img.className="captured-piece";
            img.src=IMG[pc.color+pc.type];
            img.alt=pc.color+pc.type;
            capturedByWhiteEl.appendChild(img);
        })

        game.capturedByBlack.forEach(pc=>{
            const img=document.createElement("img");
            img.className="captured-piece";
            img.src=IMG[pc.color+pc.type];
            img.alt=pc.color+pc.type;
            capturedByBlackEl.appendChild(img);
        });
    }

    function drawMoveList(){
        movesEl.innerHTML="";

        for(let i=0;i<game.moveList.length;i+=2){
            const row=document.createElement("div");
            row.className="move-row";

            const moveNo=(i/2)+1;
            const w=game.moveList[i];
            const b=game.moveList[i+1];

            row.innerHTML=`
                <div>${moveNo}.</div>
                <div>${w?w.icon+" "+w.text:""}</div>
                <div>${b?b.icon+" "+b.text:""}</div>
            `;
            movesEl.appendChild(row);
        }
        movesEl.scrollTop=movesEl.scrollHeight;
    }

    function drawBoard(){
        boardEl.innerHTML="";

        for(let r=0;r<8;r++){
          for(let c=0;c<8;c++){
            const sq = document.createElement("div");
            sq.className = "square "+((r+c)%2===0?"light":"dark");
            sq.dataset.r=r;
            sq.dataset.c=c;
            
            if(game.selected && game.selected.r===r && game.selected.c===c){
                sq.classList.add("selected");
            }

            const legal=game.legalMoves.find(m=>m.to.r===r && m.to.c===c);
            if(legal){
                if(game.board[r][c]){
                    sq.classList.add("legal-capture");
                }
                else{
                    const dot=document.createElement("div");
                    dot.className="legal-dot";
                    sq.appendChild(dot);
                }
            }


            const piece=game.board[r][c];
            if(piece){
              const img=document.createElement("img");
              img.className="piece";
              img.src=IMG[piece.color+piece.type];
              img.alt=piece.color+piece.type;
              sq.appendChild(img);
            }

            sq.addEventListener("click",onSquareClick);
            boardEl.appendChild(sq);
          }
        }
        statusEl.textContent=`${game.turn === "w"?"White":"Black"} to move`;
        drawCapturedPieces();
        drawMoveList();
    }
  drawBoard();
};