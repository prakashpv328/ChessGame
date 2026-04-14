window.onload = function () {
    const boardEl = document.getElementById("board");
    const statusEl= document.getElementById("status");
    const movesEl=document.getElementById("moves");
    const capturedByWhiteEl=document.getElementById("capturedByWhite");
    const capturedByBlackEl=document.getElementById("capturedByBlack");

    const undoBtn=document.getElementById("undoBtn");
    const redoBtn=document.getElementById("redoBtn");
    const resetBtn=document.getElementById("resetBtn");

    const promotionModal=document.getElementById("promotionModal");
    const promotionChoicesEl=document.getElementById("promotionChoices");

    const exportPgnBtn=document.getElementById("exportPgnBtn");

    const claim50Btn=document.getElementById("claim50Btn");
    const claim3foldBtn=document.getElementById("claim3foldBtn");

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
    const clone=(obj)=>JSON.parse(JSON.stringify(obj));

    function createStartBoard(){
        const b = Array.from({length:8},()=>Array(8).fill(null));

        b[0]=[p("b","R"),p("b","N"),p("b","B"),p("b","Q"),p("b","K"),p("b","B"),p("b","N"),p("b","R")];
        b[1]=Array.from({length:8},()=>p("b","P"));

        b[6]=Array.from({length:8},()=>p("w","P"));
        b[7]=[p("w","R"),p("w","N"),p("w","B"),p("w","Q"),p("w","K"),p("w","B"),p("w","N"),p("w","R")];

        return b;
    }

    function createNewGame(){
        return{
            board:createStartBoard(),
            turn:"w",
            selected:null,
            legalMoves:[],
            capturedByWhite:[],
            capturedByBlack:[],
            moveList:[],
            lastMove:null,
            enPassantTarget:null,
            castlingRights:{
                w:{K:true,Q:true},
                b:{K:true,Q:true}
            },
            halfMoveClock:0,
            positionCounts:{},
            gameOver:false,
            gameResult:"",
        };
    };

    let game=createNewGame();
    let undoStack=[];
    let redoStack=[];
    let pendingPromotionMove=null;
    let dragFrom=null;

    function snapshot(){
        return clone({
            board:game.board,
            turn:game.turn,
            selected:null,
            legalMoves:[],
            capturedByWhite:game.capturedByWhite,
            capturedByBlack:game.capturedByBlack,
            moveList:game.moveList,
            lastMove:game.lastMove,
            enPassantTarget:game.enPassantTarget,
            castlingRights:game.castlingRights,
            halfMoveClock:game.halfMoveClock,
            positionCounts:game.positionCounts,
            gameOver:game.gameOver,
            gameResult:game.gameResult
        });
    }

    function restore(state){
        game.board=state.board;
        game.turn=state.turn;
        game.selected=null;
        game.legalMoves=[];
        game.capturedByWhite=state.capturedByWhite;
        game.capturedByBlack=state.capturedByBlack;
        game.moveList=state.moveList;
        game.lastMove=state.lastMove || null;
        game.enPassantTarget=state.enPassantTarget || null;
        game.castlingRights=state.castlingRights || {w:{K:true,Q:true},b:{K:true,Q:true}};
        game.halfMoveClock=state.halfMoveClock || 0;
        game.positionCounts=state.positionCounts || {};
        game.gameOver=!!state.gameOver;
        game.gameResult=state.gameResult || "";
    }

    function findKing(board,color){
        for(let r=0;r<8;r++){
            for(let c=0;c<8;c++){
                const x=board[r][c];
                if(x && x.color===color && x.type==="K") return {r,c};
            }
        }
        return null;
    }

    function isSquareAttackedOnBoard(b,r,c,byColor){
        const pawnDir = byColor==="w"?-1:1;
        for(const dc of [-1,1]){
            const rr=r-pawnDir,cc=c+dc;
            if(inBoard(rr,cc) && b[rr][cc] && b[rr][cc].color===byColor && b[rr][cc].type==="P")
                return true;
        }

        const nMoves=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for(const [dr,dc] of nMoves){
            const rr=r+dr,cc=c+dc;
            if(inBoard(rr,cc) && b[rr][cc] && b[rr][cc].color===byColor && b[rr][cc].type==="N")
                return true;
        }

        for(let dr=-1;dr<=1;dr++){
            for(let dc=-1;dc<=1;dc++){
                if(dr===0 && dc===0) continue;
                const rr=r+dr,cc=c+dc;
                if(inBoard(rr,cc) && b[rr][cc] && b[rr][cc].color===byColor && b[rr][cc].type==="K")
                    return true;
            }
        }

        for(const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]){
            let rr=r+dr,cc=c+dc;
            while(inBoard(rr,cc)){
                if(b[rr][cc]){
                    if(b[rr][cc].color===byColor && (b[rr][cc].type==="B" || b[rr][cc].type==="Q"))
                        return true;
                    break;
                }
                rr+=dr;
                cc+=dc;
            }
        }

        for(const [dr,dc] of [[-1,0],[0,-1],[0,1],[1,0]]){
            let rr=r+dr,cc=c+dc;
            while(inBoard(rr,cc)){
                if(b[rr][cc]){
                    if(b[rr][cc].color===byColor && (b[rr][cc].type==="R" || b[rr][cc].type==="Q"))
                        return true;
                    break;  
                }
                rr+=dr;
                cc+=dc;
            }
        }
        
        return false;
    }

    function isSquareAttacked(r,c,byColor){
        return isSquareAttackedOnBoard(game.board,r,c,byColor);
    }

    function isKingInCheckOnBoard(board,color){
        const k=findKing(board,color);
        if(!k) return false;
        return isSquareAttackedOnBoard(board,k.r,k.c,enemyOf(color));
    }

    function applyMoveToState(state,move){
        const b=state.board;
        const movingPiece=b[move.from.r][move.from.c];
        let capturedPiece=b[move.to.r][move.to.c];

        if(move.enPassant){
            const cap=move.enPassantPawn;
            capturedPiece=b[cap.r][cap.c];
            b[cap.r][cap.c]=null;
        }

        b[move.to.r][move.to.c]=movingPiece;
        b[move.from.r][move.from.c]=null;

        if(move.castle==="K"){
            const row=movingPiece.color==="w"?7:0;
            b[row][5]=b[row][7];
            b[row][7]=null;
        }
        else  if(move.castle==="Q"){
            const row=movingPiece.color==="w"?7:0;
            b[row][3]=b[row][0];
            b[row][0]=null;
        }

        if(move.promotion){
            b[move.to.r][move.to.c]=p(movingPiece.color,move.promotion);
        }

        return {movingPiece,capturedPiece};

    }

    function getPseudoMoves(r,c){
        const board=game.board;
        const piece=board[r][c];
        if(!piece) return [];

        const me=piece.color;
        const enemy=enemyOf(me);
        const moves=[];

        if(piece.type==="P"){
            const dir=me==="w"?-1:1;
            const startRow=me==="w"?6:1;

            const r1=r+dir;
            if(inBoard(r1,c) && !board[r1][c]){
                moves.push({from:{r,c},to:{r:r1,c}});
                const r2=r+2*dir;

                if(r===startRow && !board[r2][c]){
                    moves.push({from:{r,c},to:{r:r2,c},doublePawn:true});
                }
            }

            for(const dc of [-1,1]){
                const rr=r+dir,cc=c+dc;
                if(inBoard(rr,cc) && board[rr][cc] && board[rr][cc].color===enemy){
                    moves.push({from:{r,c},to:{r:rr,c:cc},capture:true});
                }
            }
            
            if(game.enPassantTarget){
                const ep=game.enPassantTarget;
                if(ep.r===r+dir && Math.abs(ep.c-c)===1){
                    moves.push({
                        from:{r,c},
                        to:{r:ep.r,c:ep.c},
                        capture:true,
                        enPassant:true,
                        enPassantPawn:{r:ep.pawnR,c:ep.pawnC}
                    })
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

            const homeRow=me==="w"?7:0;

            if(r===homeRow && c===4 && game.castlingRights[me].K){
                if(!board[homeRow][5] && !board[homeRow][6] && board[homeRow][7]
                    && board[homeRow][7].type==="R" && board[homeRow][7].color===me){

                    if(!isSquareAttacked(homeRow,4,enemy) &&
                        !isSquareAttacked(homeRow,5,enemy) &&
                        !isSquareAttacked(homeRow,6,enemy)){
                            moves.push({
                                from:{r,c},
                                to:{r:homeRow,c:6},
                                castle:"K"
                            });
                    }
                }
            }

            if(r===homeRow && c===4 && game.castlingRights[me].Q){
                if(!board[homeRow][1] && !board[homeRow][2] && !board[homeRow][3] &&
                   board[homeRow][0] && board[homeRow][0].type==="R" && board[homeRow][0].color===me){
                    if(!isSquareAttacked(homeRow,4,enemy) &&
                       !isSquareAttacked(homeRow,3,enemy) &&
                       !isSquareAttacked(homeRow,2,enemy)){
                        moves.push({
                            from:{r,c},
                            to:{r:homeRow,c:2},
                            castle:"Q"
                        });
                    }
                }
            }
        }
        return moves;
    }

    function  getLegalMoves(r,c){
        const piece=game.board[r][c];
        if(!piece || piece.color!==game.turn) return [];

        const pseudo=getPseudoMoves(r,c);
        const legal=[];

        for(const mv of pseudo){
            const test=clone(game);
            applyMoveToState(test,mv);
            if(!isKingInCheckOnBoard(test.board,piece.color)){
                legal.push(mv);
            }
        }
        return legal;
    }

    function boardKey(){
        const rows=[];
        for(let r=0;r<8;r++){
            let row="";
            for(let c=0;c<8;c++){
                const pc=game.board[r][c];
                row+=pc ? (pc.color+pc.type) : "..";
            }
            rows.push(row);
        }
        const ep=game.enPassantTarget?`${game.enPassantTarget.r},${game.enPassantTarget.c}`:"-";
        const cr=JSON.stringify(game.castlingRights);
        return `${rows.join("|")} turn:${game.turn} ep:${ep} cr:${cr}`;
    }

    function bumpPositionCount(){
        const key=boardKey();
        game.positionCounts[key]=(game.positionCounts[key] || 0)+1;
    }

    function getResultCode(){
        if(!game.gameOver) return "*";

        if(game.gameResult.includes("Checkmate! White wins")) return "1-0";
        if(game.gameResult.includes("Checkmate! Black wins")) return "0-1";
        if(game.gameResult.includes("Draw") || game.gameResult.includes("Stalemate")) return "1/2-1/2";

        return "*";
    }

    function buildPgn(){
        const headers=[
            '[Event "Casual Game"]',
            '[Site "Local"]',
            `[Date "${new Date().toISOString().split("T")[0]}"]`,
            '[Round "-"]',
            '[White "Player1"]',
            '[Black "Player2"]',
            `[Result "${getResultCode()}"]`
        ]
        const moves=[];

        for(let i=0;i<game.moveList.length;i+=2){
            const n=(i/2)+1;
            const w=game.moveList[i]?.text || "";
            const b=game.moveList[i+1]?.text || "";
            moves.push(`${n}. ${w}${b ? " " + b : ""}`);
        }
        return `${headers.join("\n")}\n\n${moves.join("\n")}\n${getResultCode()}`.trim();
    }

    function downloadTextFile(filename,text){
        const blob=new Blob([text],{type:"text/plain;charset=utf-8"});
        const url=URL.createObjectURL(blob);
        const a=document.createElement("a");
        a.href=url;
        a.download=filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function canClaim50MoveRule(){
        return game.halfMoveClock>=100;
    }
    function canClaimThreefold(){
        const key=boardKey();
        return (game.positionCounts[key] || 0) >= 3;
    }

    function pieceIconHtml(color,type){
        return `<img class="move-piece-icon" src="${IMG[color+type]}" alt="${color+type}"/>`;
    }

    function getMoveText(piece,move,checkSuffix=""){
        if(move.castle==="K") return "O-O"+checkSuffix;
        if(move.castle==="Q") return "O-O-O"+checkSuffix;

        const to =squareName(move.to.r,move.to.c);
        const letter=piece.type==="P"?"":piece.type;
        const take=move.capture?"x":"";
        const promo=move.promotion?"="+move.promotion:"";
        return letter+take+to+promo+checkSuffix;
    }    

    function isPromotionMove(move){
        const movingPiece=game.board[move.from.r][move.from.c];
        if(!movingPiece || movingPiece.type!=="P") return false;
        return (movingPiece.color==="w" && move.to.r===0) || (movingPiece.color==="b" && move.to.r===7);
    }
    

    function openPromotionModal(color){
        promotionChoicesEl.innerHTML="";
        const options=["Q","R","B","N"];

        options.forEach(type=>{
            const btn=document.createElement("button");
            btn.className="promotion-btn";
            btn.innerHTML=`<img src="${IMG[color+type]}" alt="${color+type}"/>`;

            btn.addEventListener("click",()=>{
                if(!pendingPromotionMove) return;
                pendingPromotionMove.promotion=type;
                promotionModal.classList.add("hidden");
                finalizeMove(pendingPromotionMove);
                pendingPromotionMove=null;
                drawBoard();
            });

            promotionChoicesEl.appendChild(btn);
        })
        promotionModal.classList.remove("hidden");
    }

    function updateCastlingRights(move,movingPiece,capturedPiece){
        const me=movingPiece.color;

        if(movingPiece.type==="K"){
            game.castlingRights[me].K=false;
            game.castlingRights[me].Q=false;
        }

        if(movingPiece.type==="R"){
            if(me==="w" && move.from.r===7 && move.from.c===0) game.castlingRights.w.Q=false;
            if(me==="w" && move.from.r===7 && move.from.c===7) game.castlingRights.w.K=false;
            if(me==="b" && move.from.r===0 && move.from.c===0) game.castlingRights.b.Q=false;
            if(me==="b" && move.from.r===0 && move.from.c===7) game.castlingRights.b.K=false;
        }

        if(capturedPiece && capturedPiece.type==="R"){
            const ec = capturedPiece.color;
            if(ec==="w" && move.to.r===7 && move.to.c===0) game.castlingRights.w.Q=false;
            if(ec==="w" && move.to.r===7 && move.to.c===7) game.castlingRights.w.K=false;
            if(ec==="b" && move.to.r===0 && move.to.c===0) game.castlingRights.b.Q=false;
            if(ec==="b" && move.to.r===0 && move.to.c===7) game.castlingRights.b.K=false;
        }

    }

    function updateGameEndState(){
        if(isInsufficientmaterial(game.board)){
            game.gameOver=true;
            game.gameResult="Draw due to insufficient material";
            return;
        }

        const side=game.turn;
        const inCheck=isKingInCheckOnBoard(game.board,side);
        const anyMove=hasAnyLegalMove(side);

        if(!anyMove){
            game.gameOver=true;
            if(inCheck){
                const winner=side==="w"?"Black":"White";
                game.gameResult=`Checkmate! ${winner} wins`;
            }
            else{
                game.gameResult="Stalemate! Draw";
            }
        }
        else{
            game.gameOver=false;
            game.gameResult="";
        }
    }

    function finalizeMove(move){
        undoStack.push(snapshot());
        redoStack=[];

        const b=game.board;
        const movingPiece=b[move.from.r][move.from.c];
        let capturedPiece=b[move.to.r][move.to.c];

        if(move.enPassant){
            const cap=move.enPassantPawn;
            capturedPiece=b[cap.r][cap.c];
            b[cap.r][cap.c]=null;
        }

        if(capturedPiece){
            if(movingPiece.color==="w") game.capturedByWhite.push(capturedPiece);
            else game.capturedByBlack.push(capturedPiece);
        }

        if(movingPiece.type==="P" || capturedPiece){
            game.halfMoveClock=0;
        }
        else{
            game.halfMoveClock++;
        }

        b[move.to.r][move.to.c]=movingPiece;
        b[move.from.r][move.from.c]=null;

        if(move.castle==="K"){
            const row = movingPiece.color==="w" ? 7 : 0;
            b[row][5] = b[row][7];
            b[row][7] = null;
        } else if(move.castle==="Q"){
            const row = movingPiece.color==="w" ? 7 : 0;
            b[row][3] = b[row][0];
            b[row][0] = null;
        }

        
        if(move.promotion){
            b[move.to.r][move.to.c]=p(movingPiece.color,move.promotion);
        }

        updateCastlingRights(move,movingPiece,capturedPiece);
        
        // game.moveList.push({
        //     icon :pieceIconHtml(movingPiece.color,movingPiece.type),
        //     text:getMoveText(movingPiece,move)
        // });

        game.lastMove={
            from:{r:move.from.r,c:move.from.c},
            to:{r:move.to.r,c:move.to.c}
        }

        game.enPassantTarget=null;
        if(movingPiece.type==="P" && move.doublePawn){
            const midR=(move.from.r+move.to.r)/2;
            game.enPassantTarget={
                r:midR,
                c:move.from.c,
                pawnR:move.to.r,
                pawnC:move.to.c
            };
        }

        game.turn=enemyOf(game.turn);
        game.selected=null;
        game.legalMoves=[];

        const opponent=game.turn;
        const oppInCheck=isKingInCheckOnBoard(game.board,opponent);
        const oppHasLegal=hasAnyLegalMove(opponent);
        const suffix=oppInCheck?(oppHasLegal?"+":"#"):"";

        game.moveList.push({
            icon:pieceIconHtml(movingPiece.color,movingPiece.type),
            text:getMoveText(movingPiece,move,suffix)
        });

        bumpPositionCount();
        updateGameEndState();
    }

    function hasAnyLegalMove(color){
        for(let r=0;r<8;r++){
            for(let c=0;c<8;c++){
                const piece=game.board[r][c];
                if(piece && piece.color===color){
                    const pseudo=getPseudoMoves(r,c);
                    for(const mv of pseudo){
                        const test=clone(game);
                        applyMoveToState(test,mv);
                        if(!isKingInCheckOnBoard(test.board,color)){
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    function getBishopSquareColor(r,c){
        return (r+c)%2===0 ? "light" : "dark";
    }

    function isInsufficientmaterial(board){
        const white=[];
        const black=[];

        for(let r=0;r<8;r++){
            for(let c=0;c<8;c++){
                const piece=board[r][c];
                if(!piece) continue;
                if(piece.color==="w") white.push({type:piece.type,r,c});
                else black.push({type:piece.type,r,c});
            }
        }

        const heavy=["P","R","Q"];
        if(white.some(p=>heavy.includes(p.type)) || black.some(p=>heavy.includes(p.type))){
            return false;
        }

        if(white.length===1 && black.length===1) return true;

        const wMinors=white.filter(p=>p.type==="B" || p.type==="N");
        const bMinors=black.filter(p=>p.type==="B" || p.type==="N");

        if(white.length===2 && black.length===1 && wMinors.length===1){
            return true;
        }
        if(black.length===2 && white.length===1 && bMinors.length===1) {
            return true;
        }

        if(white.length===2 && black.length===2 && 
            wMinors.length===1 && bMinors.length===1 &&
            wMinors[0].type==="B" && bMinors[0].type==="B"){
                const wColor =getBishopSquareColor(wMinors[0].r,wMinors[0].c);
                const bColor =getBishopSquareColor(bMinors[0].r,bMinors[0].c);
                return wColor===bColor;
        }
        return false;
    }
   

    function isSameMove(a,b){
        return a.from.r===b.from.r && a.from.c===b.from.c && a.to.r===b.to.r && a.to.c===b.to.c;
    }

    function onSquareClick(e){
        if(game.gameOver) return;

        const r=Number(e.currentTarget.dataset.r);
        const c=Number(e.currentTarget.dataset.c);
        const clickedPiece=game.board[r][c];

        if(game.selected){
            const chosen=game.legalMoves.find(m=>m.to.r===r && m.to.c===c);
            if(chosen){
                if(isPromotionMove(chosen)){
                    pendingPromotionMove=clone(chosen);
                    const pawn=game.board[chosen.from.r][chosen.from.c];
                    openPromotionModal(pawn.color);
                }
                else{
                    finalizeMove(chosen);
                    drawBoard();
                }
                return;
            }
        }

        if(clickedPiece && clickedPiece.color===game.turn){
            game.selected={r,c};
            game.legalMoves=getLegalMoves(r,c);
        }
        else{
            game.selected=null;
            game.legalMoves=[];
        }
        drawBoard();
    }

    function getStatusText(){
        if(game.gameOver){
            return game.gameResult;
        }

        const side=game.turn;
        const check=isKingInCheckOnBoard(game.board,side);

        if(check){
            return `${side==="w"?"White":"Black"} in check`;
        }
        return `${side==="w"?"White":"Black"} to move`;
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
        });

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

    function onSquareDragStart(e){
        if(game.gameOver) return;
        e.stopPropagation();

        const r=Number(e.currentTarget.dataset.r);
        const c=Number(e.currentTarget.dataset.c);
        const piece=game.board[r][c];

        if(!piece || piece.color!==game.turn){
            e.preventDefault();
            return;
        }

        dragFrom={r,c};
        game.selected={r,c};
        game.legalMoves=getLegalMoves(r,c);

        const img=e.currentTarget.querySelector(".piece");
        if(img){
            img.classList.add("dragging");
        }
        if(e.dataTransfer){
            e.dataTransfer.setData("text/plain",`${r},${c}`);
            e.dataTransfer.effectAllowed="move";
        }
    }

    function onSquareDragOver(e){
        if(!dragFrom || game.gameOver) return;
        e.preventDefault();
        e.currentTarget.classList.add("drag-over");
    }

    function onSquareDragLeave(e){
        e.currentTarget.classList.remove("drag-over");
    }

    function onSquareDrop(e){
        e.preventDefault();
        e.currentTarget.classList.remove("drag-over");

        if(!dragFrom) return;

        const toR=Number(e.currentTarget.dataset.r);
        const toC=Number(e.currentTarget.dataset.c);

        const chosen=game.legalMoves.find(m=>m.to.r===toR && m.to.c===toC);

        if(chosen){
            if(isPromotionMove(chosen)){
                pendingPromotionMove = clone(chosen);
                const pawn = game.board[chosen.from.r][chosen.from.c];
                openPromotionModal(pawn.color);
                dragFrom = null;
                return;
            }
            else{
                finalizeMove(chosen);
            }
        }

        dragFrom=null;
        game.selected=null;
        game.legalMoves=[];
        drawBoard();
    }

    function onSquareDragEnd(e){
        const img=e.currentTarget.querySelector(".piece");
        if(img){
            img.classList.remove("dragging");
        }

        dragFrom=null;
        game.selected=null;
        game.legalMoves=[];
        drawBoard();
    }

    function drawBoard(){
        boardEl.innerHTML="";

        let checkedKing=null;
        if(!game.gameOver && isKingInCheckOnBoard(game.board,game.turn)){
            checkedKing=findKing(game.board,game.turn);
        }

        for(let r=0;r<8;r++){
            for(let c=0;c<8;c++){
                const sq = document.createElement("div");
                sq.className = "square "+((r+c)%2===0?"light":"dark");
                sq.dataset.r=r;
                sq.dataset.c=c;

                if(game.lastMove){
                    const isFrom=game.lastMove.from.r===r && game.lastMove.from.c===c;
                    const isTo=game.lastMove.to.r===r && game.lastMove.to.c===c;
                    if(isFrom || isTo){
                        sq.classList.add("last-move");
                    }
                }
            
                if(game.selected && game.selected.r===r && game.selected.c===c){
                    sq.classList.add("selected");
                }

                const legal=game.legalMoves.find(m=>m.to.r===r && m.to.c===c);
                if(legal){
                    if(game.board[r][c] || legal.enPassant){
                        sq.classList.add("legal-capture");
                    }
                    else{
                        const dot=document.createElement("div");
                        dot.className="legal-dot";
                        sq.appendChild(dot);
                    }
                }

                if(checkedKing && checkedKing.r===r && checkedKing.c===c){
                    sq.classList.add("king-in-check");
                }

                const piece=game.board[r][c];
                if(piece){
                    const img=document.createElement("img");
                    img.className="piece";
                    img.src=IMG[piece.color+piece.type];
                    img.alt=piece.color+piece.type;
                    sq.appendChild(img);

                    if(piece.color === game.turn){
                        sq.draggable = true;
                        sq.addEventListener("dragstart", onSquareDragStart);
                        sq.addEventListener("dragend", onSquareDragEnd);
                    }

                }

                sq.addEventListener("click",onSquareClick);
                sq.addEventListener("dragover",onSquareDragOver);
                sq.addEventListener("dragleave",onSquareDragLeave);
                sq.addEventListener("drop",onSquareDrop);

                boardEl.appendChild(sq);
            }
        }
        statusEl.textContent=getStatusText();
        drawCapturedPieces();
        drawMoveList();
    }

    undoBtn.addEventListener("click",()=>{
        if(undoStack.length===0) return;

        redoStack.push(snapshot());

        const prev=undoStack.pop();
        restore(prev);
        drawBoard();
    });

    redoBtn.addEventListener("click",()=>{
        if(redoStack.length===0) return;

        undoStack.push(snapshot());

        const next=redoStack.pop();
        restore(next);
        drawBoard();
    })

    resetBtn.addEventListener("click",()=>{
        game=createNewGame();
        undoStack=[];
        redoStack=[];
        pendingPromotionMove=null;
        promotionModal.classList.add("hidden");
        bumpPositionCount();
        updateGameEndState();
        drawBoard();
    });

    exportPgnBtn.addEventListener("click",()=>{
        const pgn=buildPgn();
        downloadTextFile("game.pgn",pgn);
    });

    claim50Btn.addEventListener("click",()=>{
        if(game.gameOver) return;
        if(canClaim50MoveRule()){
            game.gameOver=true;
            game.gameResult="Draw claimed by 50-move rule";
            drawBoard();
        }
        else{
            alert("50-move draw is not claimable yet.")
        }
    });

    claim3foldBtn.addEventListener("click",()=>{
        if(game.gameOver) return;
        if(canClaimThreefold()){
            game.gameOver=true;
            game.gameResult="Draw claimed by threefold repetition";
            drawBoard();
        }
        else{
            alert("Threefold repetition draw is not claimable yet.");
        }
    })

    bumpPositionCount();
    updateGameEndState();
    drawBoard();
};