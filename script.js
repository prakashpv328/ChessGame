window.onload = function () {
    const boardEl = document.getElementById("board");
    const statusRowEl=document.getElementById("statusRow");
    const statusEl= document.getElementById("status");
    const movesEl=document.getElementById("moves");
    const capturedByWhiteEl=document.getElementById("capturedByWhite");
    const capturedByBlackEl=document.getElementById("capturedByBlack");

    const whiteCapPointsEl=document.getElementById("whiteCapPoints");
    const blackCapPointsEl=document.getElementById("blackCapPoints");

    const undoBtn=document.getElementById("undoBtn");
    const redoBtn=document.getElementById("redoBtn");
    const resetBtn=document.getElementById("resetBtn");

    const promotionModal=document.getElementById("promotionModal");
    const promotionChoicesEl=document.getElementById("promotionChoices");

    const claim50Btn=document.getElementById("claim50Btn");
    const claim3foldBtn=document.getElementById("claim3foldBtn");

    const lobbyEl=document.getElementById("lobby");
    const startGameBtn=document.getElementById("startGameBtn");
    const whiteNameEl=document.getElementById("whiteName");
    const blackNameEl=document.getElementById("blackName");

    const lobbySettingsBtn=document.getElementById("lobbySettingsBtn");
    const settingsModal=document.getElementById("settingsModal");
    const closeSettingsBtn=document.getElementById("closeSettingsBtn");
    const saveSettingsBtn=document.getElementById("saveSettingsBtn");

    const whiteSideBtn=document.getElementById("whiteSideBtn");
    const blackSideBtn=document.getElementById("blackSideBtn");

    const capBoxWhite=document.getElementById("capBoxWhite");
    const capBoxBlack=document.getElementById("capBoxBlack");
    const panelEl=document.querySelector(".panel");
    const buttonsWrap=document.querySelector(".buttons");
    const mobileMovesBtn=document.getElementById("mobileMovesBtn");
    const mobileBackBtn=document.getElementById("mobileBackBtn");

    const suggestionsOnBtn=document.getElementById("suggestionsOnBtn");
    const suggestionsOffBtn=document.getElementById("suggestionsOffBtn");    
    const soundOnBtn=document.getElementById("soundOnBtn");
    const soundOffBtn=document.getElementById("soundOffBtn");

    const gameEndModal=document.getElementById("gameEndModal");
    const resultTitle=document.getElementById("resultTitle");
    const resultText=document.getElementById("resultText");

    const restartFromPopupBtn=document.getElementById("restartFromPopupBtn");
    const backToLobbyBtn=document.getElementById("backToLobbyBtn");

    const downloadMovesBtn=document.getElementById("downloadMovesBtn");
    const winnerKingsWrap=document.getElementById("winnerKingsWrap");
    const winnerKingImgW=document.getElementById("winnerKingImgW");
    const winnerKingImgB=document.getElementById("winnerKingImgB");

    const timerNoneBtn=document.getElementById("timerNoneBtn");
    const timer5Btn=document.getElementById("timer5Btn");
    const timer10Btn=document.getElementById("timer10Btn");
    const timerCustomBtn=document.getElementById("timerCustomBtn");
    const customTimerWrap=document.getElementById("customTimerWrap");
    const customTimerInput=document.getElementById("customTimerInput");

    const clockWhiteEl=document.getElementById("clockWhite");
    const clockBlackEl=document.getElementById("clockBlack");

    const appEl=document.querySelector(".app");
    let orientationGuardEl=null;


    const IMG = {
        wK:"pieces/white/king.png",wQ:"pieces/white/queen.png",wR:"pieces/white/rook.png",wB:"pieces/white/bishop.png",wN:"pieces/white/knight.png",wP:"pieces/white/pawn.png",
        bK:"pieces/black/king.png",bQ:"pieces/black/queen.png",bR:"pieces/black/rook.png",bB:"pieces/black/bishop.png",bN:"pieces/black/knight.png",bP:"pieces/black/pawn.png"
    };

    const SOUND={
        gameStart:new Audio("sounds/game_start.mp3"),
        moveSelf:new Audio("sounds/move_self.mp3"),
        moveOpponent:new Audio("sounds/move_opponent.mp3"),
        capture:new Audio("sounds/capture.mp3"),
        castle:new Audio("sounds/castle.mp3"),
        illegal:new Audio("sounds/illegal.mp3"),
        promote:new Audio("sounds/promote.mp3"),
        moveCheck:new Audio("sounds/move_check.mp3"),
        gameEnd:new Audio("sounds/game_end.mp3"),
    }

    const PIECE_POINTS={ P:1, N:3, B:3, R:5, Q:9, K:0 };

    function totalCapturedPoints(arr){
        return arr.reduce((sum,pc)=>sum+(PIECE_POINTS[pc.type] || 0),0);
    }

    function playSound(audio){
        if(!showSound || !audio) return;
        try{
            audio.currentTime=0;
            audio.play().catch(()=>{});
        }catch(_){}
    }

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

    let players={white:"Player1", black:"Player2"};
    let playerSide="w";
    let draftPlayerSide="w";
    const PLAYER_SIDE_KEY="chess-player-side";

    let showSuggestions=true;
    let draftShowSuggestions=true;
    const SUGGESTIONS_KEY="chess-show-suggestions";

    let showSound=true;
    let draftShowSound=true;
    const SOUND_KEY="chess-sound-enabled";

    function loadSavedSuggestions(){
        try{
            const saved=localStorage.getItem(SUGGESTIONS_KEY);
            if(saved==="true" || saved==="false"){
                showSuggestions=JSON.parse(saved);
            }
        }
        catch(_){}
    }

    function saveSuggestions(){
        try{
            localStorage.setItem(SUGGESTIONS_KEY,JSON.stringify(showSuggestions));
        }
        catch(_){}
    }


    function loadSavedSoundSetting(){
        try{
            const saved=localStorage.getItem(SOUND_KEY);
            if(saved==="true" || saved==="false"){
                showSound=JSON.parse(saved);
            }
        }
        catch(_){
        }
    }

    function saveSoundSetting(){
        try{
            localStorage.setItem(SOUND_KEY,JSON.stringify(showSound));
        }
        catch(_){
        }
    }

    function stopAllSounds(){
        Object.values(SOUND).forEach(audio=>{
            try{
                audio.pause();
                audio.currentTime=0;
            }
            catch(_){
            }
        })
    }

    const TIMER_SETTINGS_KEY="chess-timer-settings";

    let timerSetting={mode:"none",minutes:0};
    let draftTimerSetting={mode:"none",minutes:0};

    let whiteTimeMs=0;
    let blackTimeMs=0;
    let activeClockColor="w";
    let timerInterval=null;
    let lastTickTs=0;

    function formatMs(ms){
        const total=Math.max(0, Math.floor(ms/1000));
        const m=Math.floor(total/60);
        const s=total%60;
        return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    }

    function isTimerEnabled(){
        return timerSetting.mode!=="none" && timerSetting.minutes>0;
    }

    function isTimerModeActive(){
        return timerSetting.mode!=="none";
    }

    function getTimerMinutesFromSetting(setting){
        if(setting.mode==="5") return 5;
        if(setting.mode==="10") return 10;
        if(setting.mode==="custom") return Math.max(1, Number(setting.minutes)||1);
        return 0;
    }

    function updateTimerButtons(val=draftTimerSetting){
        timerNoneBtn?.classList.toggle("active", val.mode==="none");
        timer5Btn?.classList.toggle("active", val.mode==="5");
        timer10Btn?.classList.toggle("active", val.mode==="10");
        timerCustomBtn?.classList.toggle("active", val.mode==="custom");
        customTimerWrap?.classList.toggle("hidden", val.mode!=="custom");
    }

    function updateUndoRedoForTimerMode(){
        const timerModeOn=isTimerModeActive();
        undoBtn.classList.toggle("hidden",timerModeOn);
        redoBtn.classList.toggle("hidden",timerModeOn);
        undoBtn.disabled=timerModeOn;
        redoBtn.disabled=timerModeOn;
        buttonsWrap?.classList.toggle("timer-mode-on",timerModeOn);
    }

    function saveTimerSetting(){
        try{
            localStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify(timerSetting));
        }
        catch(_){}
    }

    function loadSavedTimerSetting(){
        try{
            const raw=localStorage.getItem(TIMER_SETTINGS_KEY);
            if(!raw) return;
            const parsed=JSON.parse(raw);
            if(!parsed || !parsed.mode) return;

            const normalizedMode=parsed.mode==="3" ? "5" : parsed.mode;
            timerSetting={
                mode:["none","5","10","custom"].includes(normalizedMode)?normalizedMode:"none",
                minutes:Math.max(1, Number(parsed.minutes)||0)
            };
        }
        catch(_){}
    } 

    function renderClocks(){
        if(!isTimerEnabled()){
            clockWhiteEl?.classList.remove("visible");
            clockBlackEl?.classList.remove("visible");
            return;
        }

        clockWhiteEl?.classList.add("visible");
        clockBlackEl?.classList.add("visible");
        clockWhiteEl.textContent=formatMs(whiteTimeMs);
        clockBlackEl.textContent=formatMs(blackTimeMs);

        clockWhiteEl.classList.toggle("active", !game.gameOver && activeClockColor==="w");
        clockBlackEl.classList.toggle("active", !game.gameOver && activeClockColor==="b");
    }

    function stopTimerLoop(){
        if(timerInterval){
            clearInterval(timerInterval);
            timerInterval=null;
        }
    }

    function startTimerLoop(){
        stopTimerLoop();
        if(!isTimerEnabled() || game.gameOver) return;

        lastTickTs=Date.now();
        timerInterval=setInterval(()=>{
            if(game.gameOver){ stopTimerLoop(); return; }

            const now=Date.now();
            const delta=now-lastTickTs;
            lastTickTs=now;

            if(activeClockColor==="w") whiteTimeMs-=delta;
            else blackTimeMs-=delta;

            if(whiteTimeMs<=0){
                whiteTimeMs=0;
                game.gameOver=true;
                game.gameResult="Time out! Black wins";
                stopTimerLoop();
                openGameEndPopup();
            }else if(blackTimeMs<=0){
                blackTimeMs=0;
                game.gameOver=true;
                game.gameResult="Time out! White wins";
                stopTimerLoop();
                openGameEndPopup();
            }

            renderClocks();
        }, 200);
    }

    function initClocksForNewGame(){
        const mins=getTimerMinutesFromSetting(timerSetting);
        if(mins<=0){
            whiteTimeMs=0;
            blackTimeMs=0;
            activeClockColor="w";
            stopTimerLoop();
            renderClocks();
            return;
        }
        whiteTimeMs=mins*60*1000;
        blackTimeMs=mins*60*1000;
        activeClockColor="w"; // white starts
        renderClocks();
        startTimerLoop();
    }

    function syncClockAfterStateChange(){
        if(!isTimerEnabled()){
            renderClocks();
            return;
        }

        activeClockColor=game.turn;
        renderClocks();

        if(game.gameOver){
            stopTimerLoop();
        }else if(!timerInterval){
            startTimerLoop();
        }else{
            lastTickTs=Date.now();
        }
    }




    function updateSuggestionsButtons(val=draftShowSuggestions){
        if(!suggestionsOnBtn || !suggestionsOffBtn) return
        suggestionsOnBtn.classList.toggle("active",!!val);
        suggestionsOffBtn.classList.toggle("active",!val);
    }

    // function updateSoundButtons(val=draftShowSound){
    //     if(!soundOnBtn || !soundOffBtn) return;
    //     soundOnBtn.classList.toggle("active",!!val);
    //     soundOffBtn.classList.toggle("active",!val);
    // }

    function updateSoundButtons(val=draftShowSound){
        if(!soundOnBtn || !soundOffBtn) return;
        soundOnBtn.classList.toggle("active",!!val);
        soundOffBtn.classList.toggle("active",!val);
    }


    function loadSavedPlayerSide(){
        try{
            const saved=localStorage.getItem(PLAYER_SIDE_KEY);
            if(saved==="w" || saved==="b"){
                playerSide=saved;
            }
        }
        catch(_){}
    }

    function savePlayerSide(){
        try{
            localStorage.setItem(PLAYER_SIDE_KEY,playerSide);
        }
        catch(_){}
    }

    function updateBoardOrientation(){
        boardEl.classList.remove("rotated");
    }

    function updateSideButtons(side=playerSide){
        if(!whiteSideBtn || !blackSideBtn) return;
        whiteSideBtn.classList.toggle("active",side==="w");
        blackSideBtn.classList.toggle("active",side==="b");
    }

    function setPlayerSide(side){
        playerSide=side==="b" ? "b" : "w";
        updateBoardOrientation();
        updateSideButtons();
        updatePanelOrientation();
        drawBoard();
    }

    function setDraftPlayerSide(side){
        draftPlayerSide=side==="b" ? "b" : "w";
        updateSideButtons(draftPlayerSide);
    }

    function getDisplayedSquare(displayRow,displayCol){
        if(playerSide==="b"){
            return {r:7-displayRow,c:7-displayCol};
        }
        return {r:displayRow,c:displayCol};
    }
    
    function setGameUiEnabled(enabled){
        boardEl.style.pointerEvents = enabled ? "auto" : "none";
        [undoBtn,redoBtn,resetBtn,claim50Btn,claim3foldBtn].forEach(btn=>btn.disabled=!enabled);
        if(enabled){
            updateUndoRedoForTimerMode();
        }
    }

    function updatePanelOrientation(){
        if(!panelEl || !capBoxWhite || !capBoxBlack) return;

        if(playerSide==="b"){
            panelEl.insertBefore(capBoxWhite, panelEl.querySelector(".buttons"));
            panelEl.appendChild(capBoxBlack);
        }else{
            panelEl.insertBefore(capBoxBlack, panelEl.querySelector(".buttons"));
            panelEl.appendChild(capBoxWhite);
        }

        updateMobilePanelLayout();
    }

    function isMobileLayout(){
        const smallWidth = window.matchMedia("(max-width:700px)").matches;
        const touchTablet = window.matchMedia("(max-width:980px) and (pointer:coarse)").matches;
        return smallWidth || touchTablet;
    }

    function tryLockPortraitOnMobile(){
        const isTouchMobile = window.matchMedia("(max-width:980px) and (pointer:coarse)").matches;
        if(!isTouchMobile) return;

        const orientationApi = screen?.orientation;
        if(!orientationApi || typeof orientationApi.lock !== "function") return;

        orientationApi.lock("portrait").catch(()=>{});
    }

    function isMobileLandscape(){
        return window.matchMedia("(max-width:980px) and (pointer:coarse) and (orientation:landscape)").matches;
    }

    function ensureOrientationGuard(){
        if(orientationGuardEl) return;

        orientationGuardEl=document.createElement("div");
        orientationGuardEl.id="orientationGuard";
        orientationGuardEl.className="hidden";
        orientationGuardEl.innerHTML=`
            <div class="orientation-guard-card">
                <h3>Rotate Device</h3>
                <p>Please use portrait mode to continue the game.</p>
            </div>
        `;
        document.body.appendChild(orientationGuardEl);
    }

    function updateOrientationGuard(){
        ensureOrientationGuard();
        const landscapeBlocked=isMobileLandscape();
        orientationGuardEl.classList.toggle("hidden",!landscapeBlocked);
        if(landscapeBlocked){
            closeMobileMovesPopup();
        }
    }

    function closeMobileMovesPopup(){
        movesEl.classList.remove("mobile-open");
        mobileMovesBtn?.classList.remove("active");
        if(mobileMovesBtn) mobileMovesBtn.textContent="Moves"
    }

    function updateMobilePanelLayout(){
        if(!appEl || !boardEl || !statusRowEl || !buttonsWrap || !mobileMovesBtn) return;

        if(!isMobileLayout()){
            statusRowEl.style.order="";
            boardEl.style.order="";
            capBoxWhite.style.order="";
            capBoxBlack.style.order="";
            mobileMovesBtn.style.order="";
            buttonsWrap.style.order="";
            closeMobileMovesPopup();
            return;
        }

        const topCapture=playerSide==="w" ? capBoxBlack : capBoxWhite;
        const bottomCapture=playerSide==="w" ? capBoxWhite : capBoxBlack;

        statusRowEl.style.order="10";
        topCapture.style.order="20";
        boardEl.style.order="30";
        bottomCapture.style.order="40";
        mobileMovesBtn.style.order="50";
        buttonsWrap.style.order="60";
    }

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

    function openSettings(){
        draftPlayerSide=playerSide;
        draftShowSuggestions=showSuggestions;
        draftShowSound=showSound;
        updateSideButtons(draftPlayerSide);
        updateSuggestionsButtons(draftShowSuggestions);
        updateSoundButtons(draftShowSound);

        draftTimerSetting={...timerSetting};
        if(customTimerInput && draftTimerSetting.mode==="custom"){
            customTimerInput.value=String(draftTimerSetting.minutes || 15);
        }
        updateTimerButtons(draftTimerSetting);

        settingsModal.classList.remove("hidden");
    }
    function closeSettings(){
        settingsModal.classList.add("hidden");
    }

    function openGameEndPopup(){
        playSound(SOUND.gameEnd);
        stopTimerLoop();
        resultText.textContent=game.gameResult || "Game Over";
        
        const isWhiteWin=game.gameResult.includes("Checkmate! White wins") || game.gameResult.includes("Time out! White wins");
        const isBlackWin=game.gameResult.includes("Checkmate! Black wins") || game.gameResult.includes("Time out! Black wins");
        const isDraw=!isWhiteWin && !isBlackWin;

        winnerKingsWrap.innerHTML="";
        winnerKingsWrap.classList.remove("hidden");

        if(isWhiteWin){
            resultTitle.textContent="White Wins!";
            const img=document.createElement("img");
            img.className="winner-king";
            img.src=IMG.wK;
            img.alt="White King";
            winnerKingsWrap.appendChild(img);
        }
        else if(isBlackWin){
            resultTitle.textContent="Black Wins!";
            const img=document.createElement("img");
            img.className="winner-king";
            img.src=IMG.bK;
            img.alt="Black King";
            winnerKingsWrap.appendChild(img);
        }
        else{
            resultTitle.textContent="Draw";
            resultText.textContent="It's a draw!";
            const w=document.createElement("img");
            w.className="winner-king";
            w.src=IMG.wK;
            w.alt="White King";

            const b=document.createElement("img");
            b.className="winner-king";
            b.src=IMG.bK;
            b.alt="Black King";

            winnerKingsWrap.appendChild(w);
            winnerKingsWrap.appendChild(b);
        }
    
        gameEndModal.classList.remove("hidden");
    }
    
    function closeGameEndPopup(){
        gameEndModal.classList.add("hidden");
    }
    
    function restartGameFromPopup(){
        game=createNewGame();
        undoStack=[];
        redoStack=[];
        pendingPromotionMove=null;
        dragFrom=null;
        initClocksForNewGame();
        bumpPositionCount();
        updateGameEndState();
        playSound(SOUND.gameStart);
        closeGameEndPopup();
        drawBoard();
    }
    
    function backToLobby(){
        closeGameEndPopup();
        stopTimerLoop();
        appEl.classList.add("hidden");
        setGameUiEnabled(false);
        lobbyEl.classList.remove("hidden");
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
            `[White "${players.white}"]`,
            `[Black "${players.black}"]`,
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

        if(isTimerEnabled()){
            activeClockColor=game.turn;
            lastTickTs=Date.now();
            renderClocks();
        }

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

        if(game.gameOver){
            openGameEndPopup();
        }
        else if(move.promotion){
            playSound(SOUND.promote);
        }
        else if(move.castle){
            playSound(SOUND.castle);
        }
        else if(capturedPiece){
            playSound(SOUND.capture);
        }
        else{
            const sideJustMoved=movingPiece.color;
            const inCheckNow=isKingInCheckOnBoard(game.board,game.turn);

            if(inCheckNow){
                playSound(SOUND.moveCheck);
            }
            else{
                playSound(sideJustMoved==="w"?SOUND.moveSelf:SOUND.moveOpponent);
            }
        }
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
   

    // function isSameMove(a,b){
    //     return a.from.r===b.from.r && a.from.c===b.from.c && a.to.r===b.to.r && a.to.c===b.to.c;
    // }

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
            if(game.selected && !chosen){
                playSound(SOUND.illegal);
            }
        }

        if(clickedPiece && clickedPiece.color!==game.turn){
            playSound(SOUND.illegal);
            return;
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
        const whiteTotal=totalCapturedPoints(game.capturedByWhite);
        const blackTotal=totalCapturedPoints(game.capturedByBlack);
            
        const diff=whiteTotal-blackTotal;
            
        if(diff>0){
            whiteCapPointsEl.textContent=`+${diff}`;
            blackCapPointsEl.textContent="0";
        }
        else if(diff<0){
            whiteCapPointsEl.textContent="0";
            blackCapPointsEl.textContent=`+${-diff}`;
        }
        else{
            whiteCapPointsEl.textContent="0";
            blackCapPointsEl.textContent="0";
        }

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
            playSound(SOUND.illegal);
            e.preventDefault();
            return;
        }

        dragFrom={r,c};
        game.selected={r,c};
        game.legalMoves=getLegalMoves(r,c);
        
        showLegalForDrag(); 

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

        if(!chosen){
            playSound(SOUND.illegal);
        }

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

    function showLegalForDrag(){
        if(!showSuggestions) return;

        const s=boardEl.querySelector(`.square[data-r="${game.selected?.r}"][data-c="${game.selected?.c}"]`);
        if(s){
            s.classList.add("selected");
        }

        game.legalMoves.forEach(mv=>{
            const sq=boardEl.querySelector(`.square[data-r="${mv.to.r}"][data-c="${mv.to.c}"]`);
            if(!sq) return;

            if(game.board[mv.to.r][mv.to.c] || mv.enPassant){
                sq.classList.add("legal-capture");
            }
            else{
                const dot=document.createElement("div");
                dot.className="legal-dot";
                sq.appendChild(dot);
            }
        });
    }

    function drawBoard(){
        boardEl.innerHTML="";

        let checkedKing=null;
        if(!game.gameOver && isKingInCheckOnBoard(game.board,game.turn)){
            checkedKing=findKing(game.board,game.turn);
        }

        for(let displayRow=0;displayRow<8;displayRow++){
            for(let displayCol=0;displayCol<8;displayCol++){
                const {r,c}=getDisplayedSquare(displayRow,displayCol);
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
                if(showSuggestions && legal){
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

                    sq.draggable = true;
                    sq.addEventListener("dragstart", onSquareDragStart);
                    sq.addEventListener("dragend", onSquareDragEnd);

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
        if(isTimerModeActive()) return;
        if(undoStack.length===0) return;

        redoStack.push(snapshot());

        const prev=undoStack.pop();
        restore(prev);
        syncClockAfterStateChange();
        drawBoard();
    });

    redoBtn.addEventListener("click",()=>{
        if(isTimerModeActive()) return;
        if(redoStack.length===0) return;

        undoStack.push(snapshot());

        const next=redoStack.pop();
        restore(next);
        syncClockAfterStateChange();
        drawBoard();
    })

    resetBtn.addEventListener("click",()=>{
        game=createNewGame();
        undoStack=[];
        redoStack=[];
        pendingPromotionMove=null;
        promotionModal.classList.add("hidden");
        initClocksForNewGame();
        bumpPositionCount();
        updateGameEndState();
        playSound(SOUND.gameStart);
        drawBoard();
    });

    claim50Btn.addEventListener("click",()=>{
        if(game.gameOver) return;
        if(canClaim50MoveRule()){
            game.gameOver=true;
            game.gameResult="Draw claimed by 50-move rule";
            openGameEndPopup();
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
            openGameEndPopup();
            drawBoard();
        }
        else{
            alert("Threefold repetition draw is not claimable yet.");
        }
    })

    lobbySettingsBtn.addEventListener("click",openSettings);
    closeSettingsBtn.addEventListener("click",closeSettings);

    saveSettingsBtn?.addEventListener("click",()=>{
        setPlayerSide(draftPlayerSide);
        showSuggestions=draftShowSuggestions;
        showSound=draftShowSound;
        savePlayerSide();
        saveSuggestions();
        saveSoundSetting();

        timerSetting={...draftTimerSetting};
        if(timerSetting.mode==="custom"){
            timerSetting.minutes=Math.max(1, Number(customTimerInput?.value)||1);
        }
        saveTimerSetting();
        updateUndoRedoForTimerMode();

        if(!showSound){
            stopAllSounds();
        }
        closeSettings();
    });

    whiteSideBtn?.addEventListener("click",()=>setDraftPlayerSide("w"));
    blackSideBtn?.addEventListener("click",()=>setDraftPlayerSide("b"));

    suggestionsOnBtn?.addEventListener("click",()=>{
        draftShowSuggestions=true;
        updateSuggestionsButtons();
    })

    suggestionsOffBtn?.addEventListener("click",()=>{
        draftShowSuggestions=false;
        updateSuggestionsButtons();
    });

    soundOnBtn?.addEventListener("click",()=>{
        draftShowSound=true;
        updateSoundButtons();
    });

    soundOffBtn?.addEventListener("click",()=>{
        draftShowSound=false;
        updateSoundButtons();
    });

    settingsModal.addEventListener("click",(e)=>{
        if(e.target===settingsModal) closeSettings();
    });

    mobileMovesBtn?.addEventListener("click",()=>{
        if(!isMobileLayout()) return;
        const willOpen=!movesEl.classList.contains("mobile-open");
        movesEl.classList.toggle("mobile-open",willOpen);
        mobileMovesBtn.classList.toggle("active",willOpen);
        mobileMovesBtn.textContent=willOpen?"Close Moves":"Moves";
    })



    
    document.addEventListener("click",(e)=>{
        if(!isMobileLayout()) return;
        if(!movesEl.classList.contains("mobile-open")) return;

        const target=e.target;
        const clickedPopup=movesEl.contains(target);
        const clickedBtn=mobileMovesBtn?.contains(target);
        if(!clickedPopup && !clickedBtn){
            closeMobileMovesPopup();
        }
    });

    mobileBackBtn?.addEventListener("click",()=>{
        backToLobby();
    });

    window.addEventListener("resize",()=>{
        tryLockPortraitOnMobile();
        updateMobilePanelLayout();
        updateOrientationGuard();
    });
    window.addEventListener("orientationchange",()=>{
        tryLockPortraitOnMobile();
        updateMobilePanelLayout();
        updateOrientationGuard();
    });
    
    restartFromPopupBtn.addEventListener("click",restartGameFromPopup);
    backToLobbyBtn.addEventListener("click",backToLobby);

    downloadMovesBtn.addEventListener("click",()=>{
        const pgn=buildPgn();
        downloadTextFile("game.pgn",pgn);
    });

    timerNoneBtn?.addEventListener("click",()=>{ draftTimerSetting={mode:"none",minutes:0}; updateTimerButtons(); });
    timer5Btn?.addEventListener("click",()=>{ draftTimerSetting={mode:"5",minutes:5}; updateTimerButtons(); });
    timer10Btn?.addEventListener("click",()=>{ draftTimerSetting={mode:"10",minutes:10}; updateTimerButtons(); });
    timerCustomBtn?.addEventListener("click",()=>{ 
        const mins=Math.max(1, Number(customTimerInput?.value)||15);
        draftTimerSetting={mode:"custom",minutes:mins};
        updateTimerButtons();
    });
    customTimerInput?.addEventListener("input",()=>{
        if(draftTimerSetting.mode==="custom"){
            draftTimerSetting.minutes=Math.max(1, Number(customTimerInput.value)||1);
        }
    });

    appEl.classList.add("hidden");
    setGameUiEnabled(false);

    loadSavedPlayerSide();
    loadSavedSuggestions();
    loadSavedSoundSetting();

    loadSavedTimerSetting();
    draftTimerSetting={...timerSetting};
    updateTimerButtons(draftTimerSetting);
    renderClocks();
    updateUndoRedoForTimerMode();

    draftPlayerSide=playerSide;
    draftShowSuggestions=showSuggestions;
    draftShowSound=showSound;

    updateBoardOrientation();
    updateSideButtons();
    updatePanelOrientation();
    updateMobilePanelLayout();
    tryLockPortraitOnMobile();
    updateOrientationGuard();
    updateSuggestionsButtons(draftShowSuggestions);
    updateSoundButtons(draftShowSound);

    if(!showSound){
        stopAllSounds();
    }

    drawBoard();

    startGameBtn.addEventListener("click",()=>{
        tryLockPortraitOnMobile();
        updateOrientationGuard();

        players.white=(whiteNameEl?.value || "Player1").trim() || "Player1";
        players.black=(blackNameEl?.value || "Player2").trim() || "Player2";

        game=createNewGame();
        undoStack=[];
        redoStack=[];
        pendingPromotionMove=null;
        dragFrom=null;
        updateBoardOrientation();
        updatePanelOrientation();
        initClocksForNewGame();

        bumpPositionCount();
        updateGameEndState();
        setGameUiEnabled(true);
        appEl.classList.remove("hidden");
        lobbyEl.classList.add("hidden");
        playSound(SOUND.gameStart);
        drawBoard();
    });

};