//
// MIT Licence!
// by @ina_ani
// fork me!
//

// script




//
// SKKの辞書を読み込んでメモリ上に保持する部分
// ゆくゆくはストレージに？
//

var SKKDic = function(){
    //this.filename = 'skk-jisyo.s.utf8';
    this.filename = 'skk-jisyo.ml.utf8';
    this.dict = {};
};
SKKDic.prototype = {
    fetch:function(s){
	return this.dict[s];
    },
    load:function(){
	var self = this;
	$.ajax({
		type: 'GET',
		url: this.filename,
		success:function(data){
		    var pos = 0;
		    var npos = 0;
		    var fc;
		    var tmp,key="" ,value,i;
		    var M_KEY = 0;
		    var M_VALUE = 1;
		    var mode = M_KEY;
		    var values;
		    var count = 0;
		    while(npos = data.indexOf('\n',pos)){
			count ++;
			if(npos == -1)break;
			// pos <-> npos
			fc = data[pos];
			key = "";
			mode = M_KEY;
			if(fc != ';'){ // skip comment
			    for(i = pos; i < npos; i++){
				tmp = data[i];
				switch(mode){
				case M_KEY:
				    if(tmp == " "){
					mode = M_VALUE;
					values = [];
					value = "";
				    }else{
					key += tmp;
				    }
				    break;
				case M_VALUE:
				    if(tmp == "/"){
					if(value != ''){
					    values.push(value);
					    value = "";
					}
				    }else{
					value += tmp;
				    }
				    break;
				}
			    }
			    self.dict[key] = values;
			}
			pos = npos + 1;
		    } // par line
		}
	    });
    },
};

//
// SKK変換エンジン部分 別にモノに取り替え可能？
//

var SKK = function(){
    this.mode = 1;
    this.romaMode = 0;
    this.hMode = 0;
    this.dict = new SKKDic();
    this.dict.load();
    this.henkanBuf = "";
    this.values;
    this.valuesPos;
    this.postChar = "";
};
SKK.prototype = {
    MODE_E:0,    // Ctrl+J -> J
    MODE_J:1,    // l -> E, q -> K
    MODE_KATA:2, // q -> J, \\

    HMODE_NONE:0,
    HMODE_START:1,
    HMODE_LAST:2,
    HMODE_HENKAN:3,

    ROMA_TYPE0:0,  // <a , <k , <t
    ROMA_TYPE1:1,  //      k<a, t<y
    ROMA_TYPE2:2,  //         , ty<o  // 未使用?
    buf:"", // 変換中文字が入る
    siin:"", // 確定前ローマ字が入る
    htable:{ // ローマ字テーブル
	' ':{'a':'あ', 'i':'い', 'u':'う', 'e':'え', 'o':'お', ' ':'っ','ya':'ゃ','yi':'ぃ','yu':'ゅ','ye':'ぇ','yo':'ょ'},
	'k':{'a':'か', 'i':'き', 'u':'く', 'e':'け', 'o':'こ'},
	'g':{'a':'が', 'i':'ぎ', 'u':'ぐ', 'e':'げ', 'o':'ご'},
	's':{'a':'さ', 'i':'し', 'u':'す', 'e':'せ', 'o':'そ'},
	'z':{'a':'ざ', 'i':'じ', 'u':'ず', 'e':'ぜ', 'o':'ぞ'},
	't':{'a':'た', 'i':'ち', 'u':'つ', 'e':'て', 'o':'と'},
	'd':{'a':'だ', 'i':'ぢ', 'u':'づ', 'e':'で', 'o':'ど'},
	'n':{'a':'な', 'i':'に', 'u':'ぬ', 'e':'ね', 'o':'の', 'n':'ん'},
	'h':{'a':'は', 'i':'ひ', 'u':'ふ', 'e':'へ', 'o':'ほ'},
	'b':{'a':'ば', 'i':'び', 'u':'ぶ', 'e':'べ', 'o':'ぼ'},
	'p':{'a':'ぱ', 'i':'ぴ', 'u':'ぷ', 'e':'ぺ', 'o':'ぽ'},
	'm':{'a':'ま', 'i':'み', 'u':'む', 'e':'め', 'o':'も'},
	'y':{'a':'や', 'i':'い', 'u':'ゆ', 'e':'え', 'o':'よ'},
	'r':{'a':'ら', 'i':'り', 'u':'る', 'e':'れ', 'o':'ろ'},
	'w':{'a':'わ', 'i':'い', 'u':'う', 'e':'え', 'o':'を'},
	'x':{'a':'ぁ', 'i':'ぃ', 'u':'ぅ', 'e':'ぇ', 'o':'ぉ'},
    },
    htablek:{ // ローマ字テーブル
	' ':{'a':'ア', 'i':'イ', 'u':'ウ', 'e':'エ', 'o':'オ', ' ':'ッ','ya':'ャ', 'yi':'ィ' ,'yu':'ュ','ye':'ェ','yo':'ョ'},
	'k':{'a':'カ', 'i':'キ', 'u':'ク', 'e':'ケ', 'o':'コ'},
	'g':{'a':'ガ', 'i':'ギ', 'u':'グ', 'e':'ゲ', 'o':'ゴ'},
	's':{'a':'サ', 'i':'シ', 'u':'ス', 'e':'セ', 'o':'ソ'},
	'z':{'a':'ザ', 'i':'ジ', 'u':'ズ', 'e':'ゼ', 'o':'ゾ'},
	't':{'a':'タ', 'i':'チ', 'u':'ツ', 'e':'テ', 'o':'ト'},
	'd':{'a':'ダ', 'i':'ヂ', 'u':'ヅ', 'e':'デ', 'o':'ド'},
	'n':{'a':'ナ', 'i':'ニ', 'u':'ヌ', 'e':'ネ', 'o':'ノ', 'n':'ン'},
	'h':{'a':'ハ', 'i':'ヒ', 'u':'フ', 'e':'ヘ', 'o':'ホ'},
	'b':{'a':'バ', 'i':'ビ', 'u':'ブ', 'e':'ベ', 'o':'ボ'},
	'p':{'a':'パ', 'i':'ピ', 'u':'プ', 'e':'ペ', 'o':'ポ'},
	'm':{'a':'マ', 'i':'ミ', 'u':'ム', 'e':'メ', 'o':'モ'},
	'y':{'a':'ヤ', 'i':'イ', 'u':'ユ', 'e':'エ', 'o':'ヨ'},
	'r':{'a':'ラ', 'i':'リ', 'u':'ル', 'e':'レ', 'o':'ロ'},
	'w':{'a':'ワ', 'i':'イ', 'u':'ウ', 'e':'エ', 'o':'ヲ'},
	'x':{'a':'ァ', 'i':'ィ', 'u':'ゥ', 'e':'ェ', 'o':'ォ'},
    },
    aiueo:function(s,b){
	var offset = 0;
	if(this.mode == this.MODE_J){
	    return this.htable[s][b]; // todo: error trap
	}else if(this.mode == this.MODE_KATA){
	    return this.htablek[s][b]; // todo: error trap
	}else{
	    throw "ERROR! unexpected mode";
	}
    },
    romaType:function(k){
	// ローマ字 -> ひらがな
	var self = this;
	var ret = ""
	// 入力決定文字作成  変換中はhenkanBuf内で処理する
	function typed(c){
	    if(self.hMode == self.HMODE_NONE){
		self.buf += c;
	    }else{

	    }
	}
	switch(this.romaMode){
	case this.ROMA_TYPE0:
	switch(k){
	    // 1文字確定の場合
	case 'a': ret = this.aiueo(' ','a');break;
	case 'i': ret = this.aiueo(' ','i');break;
	case 'u': ret = this.aiueo(' ','u');break;
	case 'e': ret = this.aiueo(' ','e');break;
	case 'o': ret = this.aiueo(' ','o');break;
	case '-': ret = "ー";break;
	}

	// 1文字以上の場合
	var tmp;
	tmp = "kgsztdnhbpmyrwx"; //簡易子音リスト todo: まとめる
       	for(var i = 0; i < tmp.length; i++){
	    if(tmp[i] == k){
		this.siin = tmp[i];
		this.romaMode = this.ROMA_TYPE1;
	    }
	}
	// 1文字確定の場合
	typed(ret);
	break;
	case this.ROMA_TYPE1:
	     // 同じ文字の場合「っ」
	    if(this.siin == k){
		ret = this.aiueo(' ',' ');
	    }
	    switch(k){
		// 2文字目で確定
	    case 'a': ret = this.aiueo(this.siin,'a');this.romaMode = this.ROMA_TYPE0;break;
	    case 'i': ret = this.aiueo(this.siin,'i');this.romaMode = this.ROMA_TYPE0;break;
	    case 'u': ret = this.aiueo(this.siin,'u');this.romaMode = this.ROMA_TYPE0;break;
	    case 'e': ret = this.aiueo(this.siin,'e');this.romaMode = this.ROMA_TYPE0;break;
	    case 'o': ret = this.aiueo(this.siin,'o');this.romaMode = this.ROMA_TYPE0;break;
	    case 'n': ret = this.aiueo(this.siin,'n');this.romaMode = this.ROMA_TYPE0;break;
	    // 2文字目で未確定 (todo: "h")
	    case 'y': 
		this.romaMode = this.ROMA_TYPE2;
		this.siin = this.siin + 'y';
		break;
	    // n[^n] -> 「ん」
	    default:
		if(this.siin == 'n'){
		    if(k==" "){
			this.romaMode = this.ROMA_TYPE0;
			this.siin = "";			
		    }else{
			this.romaMode = this.ROMA_TYPE1;
			this.siin = k;
		    }
		    ret = this.aiueo('n','n');
		}
	    }
	    // 後片付け
	    if(this.romaMode == this.ROMA_TYPE0){this.siin = "";}
	    // 2文字目で確定の場合
	    typed(ret);
	// Yの処理 todo: "H"
	break;
	case this.ROMA_TYPE2:
	    var fc = this.siin[0];
	    var sc = this.siin[1];
	    if(sc == "y"){ // ゃ ゅ ょ
		switch(k){
		case 'a': ret = this.aiueo(fc,'i')+this.aiueo(' ','ya');this.romaMode = this.ROMA_TYPE0;break;
		case 'i': ret = this.aiueo(fc,'i')+this.aiueo(' ','yi');this.romaMode = this.ROMA_TYPE0;break;
		case 'u': ret = this.aiueo(fc,'i')+this.aiueo(' ','yu');this.romaMode = this.ROMA_TYPE0;break;
		case 'e': ret = this.aiueo(fc,'i')+this.aiueo(' ','ye');this.romaMode = this.ROMA_TYPE0;break;
		case 'o': ret = this.aiueo(fc,'i')+this.aiueo(' ','yo');this.romaMode = this.ROMA_TYPE0;break;
		}
	    }
            // 後片付け
	    if(this.romaMode == this.ROMA_TYPE0){this.siin = "";}
	    // 3文字目で確定
	    typed(ret);
	break;
	}
	return ret;
    },
    keytyped: function(k,code,s,c){


	// 変換候補を入れ替え
	function cycle(){
	    if(self.values){
		self.valuesPos = (self.valuesPos + 1)%self.values.length;
	    }
	}

	// 変換開始
	function henkan(k){
	    var tmp = self.dict.fetch(self.henkanBuf + k);
	    self.values = tmp;
	    self.valuesPos = 0;
	    //console.log("fetch:" + self.henkanBuf + k + "::" + tmp);
	    self.hMode = self.HMODE_HENKAN;
	}

	// 変換確定
	function enter(){
	    if(self.values){
		self.buf += self.values[self.valuesPos] + self.postChar;
	    }else{
		// 変換候補なし
		self.buf += self.henkanBuf + self.postChar;
	    }
	    self.hMode = self.HMODE_NONE;
	    self.henkanBuf = "";
	    self.values = null;
	    self.postChar = "";
	}


	var isShift = s;
	var isCtrl = c;
	//console.log(k,k.toLowerCase(),code,s);
	k = k.toLowerCase();
	var ret = "";
	var self = this;

	// 変換テーブル(特殊処理)
	switch(code){
	case 189: k = '-';break;
	}

        // 変換中の特殊操作
	if(this.hMode == this.HMODE_HENKAN){
	    if(k == " "){
		cycle();
		k = "";
	    }else{
		enter();
	    }
	}else if(this.hMode == this.HMODE_NONE){
	    switch(k){
	    case " ": this.buf += " ";k = "";isShift = false;break;
	    case "!": this.buf += "!";k = "";isShift = false;break;
	    case "?": this.buf += "?";k = "";isShift = false;break;
	    }
	    
	}

	// バックスペース入力途中の操作
	if(code == 8){ //bs
	    if(this.hMode == this.HMODE_HENKAN){ //変換途中はなにもしない（todo: 候補戻し）
	    }else{ // 変換以外
		if(this.romaMode == this.ROMA_TYPE1){ //１文字入力済みの時は 子音キャンセル
		    this.siin = "";
		    this.romaMode = this.ROMA_TYPE0;
		}else if(this.romaMode == this.ROMA_TYPE2){ // 2文字入力済みの時は子音一文字キャンセル
		    this.siin = this.siin[0];
		    this.romaMode = this.ROMA_TYPE1;
		}else if(this.romaMode == this.ROMA_TYPE0){ // 0文字入力済み時は 
		    if(this.hMode == this.HMODE_START){ // 変換開始時は変換候補文字をけずる
			this.henkanBuf = this.henkanBuf.slice(0,-1);
		    }else{  //todo: 外にBSを送り出す
			// ROMA_TYPE0 ^ not HENKAN
			this.buf += "\b"; // backspace
		    }
		}
	    }
	    // BSは入力として扱わないので消しておく
	    k = "";
	    code = 0;
	}

	if(this.hMode == this.HMODE_NONE && this.buf == ""){
	    switch(code){
	    case 13:
	    this.buf = "\n";
	    k="";
	    }
	}
	switch(code){
	case 37:
	case 38:
	case 39:
	case 40:
	k = ""; // SKKでは扱わない
	}
	// todo: 英字モード
	if(this.mode == this.MODE_E){
	    if(isCtrl){
		if(k=='j'){
		    this.mode = this.MODE_J;
		}
		// none;
	    }else{
		this.buf += k;
	    }
	}else{
	// todo: J,kana
	    if(isCtrl){
		k = "";
	    }
	    if(k == 'l'){
		this.mode = this.MODE_E;
	    }else if (k == 'q'){
		if(this.mode == this.MODE_J)this.mode = this.MODE_KATA;
		else this.mode = this.MODE_J;
	    }
	    
	// Shift付きの場合前処理
	if(isShift){
	    //console.log("SHIFT")
	    // Shift付きの場合の特殊処理 変換開始 or 変換終了?
	    switch(this.hMode){
	    case this.HMODE_NONE: // 変換開始
	    this.hMode = this.HMODE_START; // start kanji
	    //console.log("START")
	    //this.henkanBuf = ret;  // a,i,u,e,o の場合
	    break;
	    case this.HMODE_START: // 変換確定 母音待ち 母音が来てたら変換処理
	    if("aiueo".indexOf(k) != -1){
		henkan(k); //今の1文字を加えて検索開始
		this.postChar = this.aiueo(' ', k); // 変換後にひっつける処理
		k = ""; // 確定時に再度打ちこむので今回は使わない
	    }else{ // 子音ならHMODE_LAST
		//console.log("LAST")
		this.hMode = this.HMODE_LAST; // 母音の入力待ち状態
		this.postChar = k; // 子音 - 一時的に入れておく
		k = "";
	    }
	    break;
	    }
	}else{ // shiftがない場合
	    switch(this.hMode){
	    case this.HMODE_LAST: // 最後の子音 or 母音
	    if("aiueo".indexOf(k) != -1){ // 母音ならこの処理
		henkan(this.postChar); //前の1文字(子音の頭文字)を加えて検索開始
		this.postChar = this.aiueo(this.postChar,k); // 次に予約する文字
		k = ""; // 確定時に再度打ちこむので今回は使わない
	    }else{
		// 例外「っ」のとき
		if(this.postChar == k){
		    this.henkanBuf += this.aiueo(' ',' '); // っ
		    this.postChar = k;
		    k = "";
		}
	    }
	    break;
	    }
	}

	// ローマ字として文字を入力
	ret = this.romaType(k);



	// 変換中の処理（後処理）
	switch(this.hMode){
	case this.HMODE_START:
	// 変換開始中
	this.henkanBuf += ret;
	switch(code){
	case 32: // space - 変換開始
	    henkan("");
	    break;
	case 13:
	    // enter? - 確定 （いらない？）
	    enter(); 
	}
	break;
	case this.HMODE_HENKAN:
	// 変換処理中
	switch(code){
	case 13:
	    // enter?
	    enter();
	}
	break;
	}
	} // mode_j
    }
};
// ここまでIMEのコード


//---------------------------------
// from prototype.js
Object.extend = function(destination, source) {
    for (var property in source) {
        destination[property] = source[property];
    }
    return destination;
};
//---------------------------------

function Component(x, y, w, h){
    this.x = x;   this.y = y;
    this.w = w;  this.h = h;
    this.parent = null; // redraw
}
Component.prototype = {
    draw:function(ctx){
	ctx.fillStyle = "white";
	ctx.fillRect(this.x, this.y, this.w, this.h);
	
	ctx.strokeStyle = "black";
	ctx.beginPath();
	ctx.rect(this.x, this.y, this.w, this.h);
	ctx.stroke();
    },
    keytype:function(e){
    },
    keydown:function(e){
    },
    keyup:function(e){
    },
    mousedown:function(e){
    },
    mouseup:function(e){
    },
    mousemove:function(e){
    },
    resize:function(e){
    },
    redraw:function(x,y,w,h){
	if(this.parent){
	    this.parent.redraw(x + this.x, y + this.y,w,h);
	}
    },
    setImePos:function(x,y){
	if(this.parent){
	    this.parent.setImePos(x + this.x, y + this.y);
	}
    },
};

function Container(x, y, w, h){
    Component.apply(this, arguments);
    this.elements = [];
};
Object.extend(Container.prototype, Component.prototype);
Container.prototype.add = function(e){
    this.elements.push(e);
    e.parent = this;
};
Container.prototype.draw = function(ctx){
    ctx.fillStyle = "white";
    ctx.fillRect(this.x, this.y, this.w, this.h);
    
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.w, this.h);
    ctx.stroke();
    
    ctx.translate(this.x, this.y);
    for(var i = 0; i < this.elements.length; i++){
	this.elements[i].draw(ctx);
    }
    ctx.translate(-this.x, -this.y);
};
Container.prototype.keytype = function(){
    // todo: focus?
    for(var i = 0; i < this.elements.length; i++){
	this.elements[i].keytype.apply(this,arguments);
    }    
}
Container.prototype.keydown = function(){
    // todo: focus?
    for(var i = 0; i < this.elements.length; i++){
	this.elements[i].keydown.apply(this,arguments);
    }    
}

    function Editor(x, y, w, h, ctx){
    Container.apply(this, arguments);
    this.elements = [];
    for(var i = 0; i < 10; i ++){
	this.elements.push(new Line(0, i * 20, this.w, 20, ctx));
	this.elements[i].parent = this;
    }
    this.currentPos = 0;
    this.elements[this.currentPos].forcused = true;
    this.ctx = ctx;
};
Object.extend(Editor.prototype, Container.prototype);
Editor.prototype.keydown = function(e){
    var currentLine = this.elements[this.currentPos];
    if(e.isCtrl){
	switch(e.key){
	case 65: // a
	    currentLine.home();
	    break;
	case 69: // z
	    currentLine.end();
	    break;
	}
    }else{
	switch(e.key){
	case 37: // <-
	if(currentLine.cursorPos == 0){
	    this.elements[this.currentPos].forcused = false;
	    this.currentPos--; // todo: redraw range
	    if(this.currentPos < 0) this.currentPos = 0;
	    this.elements[this.currentPos].forcused = true;
	    this.elements[this.currentPos].end();
	}else{
	    currentLine.cursorPos--;
	}
	break;
	case 39:  // ->
	if(currentLine.cursorPos == currentLine.buf.length){
	    this.elements[this.currentPos].forcused = false;
	    this.currentPos++; // todo: redraw range
	    if(this.currentPos >= this.elements.length) this.currentPos = this.elements.length - 1;
	    this.elements[this.currentPos].forcused = true;
	}
	currentLine.cursorPos++;
	break;
	
	case 38: // ^ 
	this.elements[this.currentPos].forcused = false;
	this.currentPos--; // todo: redraw range
	if(this.currentPos < 0) this.currentPos = 0;
	this.elements[this.currentPos].forcused = true;
	break;
	case 40: // v 
	this.elements[this.currentPos].forcused = false;
	this.currentPos++; // todo: redraw range
	if(this.currentPos >= this.elements.length) this.currentPos = this.elements.length - 1;
	this.elements[this.currentPos].forcused = true;
	break;
	}
    }
    this.redraw(currentLine.x, currentLine.y, currentLine.w, currentLine.h);
};
Editor.prototype.keytype = function(e){
    var key = e.key;
    var currentLine = this.elements[this.currentPos];
    if(e.key == '\n'){
	this.elements[this.currentPos].forcused = false;
	this.currentPos ++;
	this.elements[this.currentPos].forcused = true;
    }else if(e.key == "\b"){
	// backspace
	if(currentLine.cursorPos == 0){
	    this.elements[this.currentPos].forcused = false;
	    this.currentPos--; // todo: redraw range
	    if(this.currentPos < 0){
		this.currentPos = 0;
	    }
	    this.elements[this.currentPos].forcused = true;
	}else{
	    currentLine.bs();
	}
    }else{
	currentLine.ins(key); // input
    }
    this.redraw(currentLine.x, currentLine.y, currentLine.w, currentLine.h);
};


function Line(x, y, w, h, ctx){
    Component.apply(this, arguments);
    this.buf = ''; // 入力された文字
    this.xbuf = []; // 文字幅
    this.cursorPos = 0;
    this.ctx = ctx;
    this.forcused = false;
    this.marginx = 5; // 文字マージン
};
Object.extend(Line.prototype, Component.prototype);
Line.prototype.ins = function(str){ // カーソル位置に文字挿入
    for(var i = 0; i < str.length; i ++){
	this.xbuf.splice(this.cursorPos, 0, this.ctx.measureText(str[i]).width);
	//this.buf.splice(this.cusrorPos, 0, str[i]);
	this.buf = this.buf.substring(0,this.cursorPos) + str[i] + this.buf.substring(this.cursorPos);
	this.cursorPos ++;
    }
    this.updateCursor();
};
Line.prototype.bs = function(str){ // カーソル位置からバックスペース
    if(this.cursorPos == 0)return; // todo: 上の行へ
    this.xbuf.splice(this.cursorPos, 1);
    this.buf = this.buf.substring(0,this.cursorPos - 1) + this.buf.substring(this.cursorPos);
    this.cursorPos --;
    this.updateCursor();
};

Line.prototype.home = function(){ // 
    this.cursorPos = 0;
    this.updateCursor();
};
Line.prototype.end = function(){ // 
    this.cursorPos = this.buf.length;
    this.updateCursor();
};


// カーソルの実位置計算
Line.prototype.updateCursor = function(){
    var ret = 0;
    for(var i = 0; i < this.cursorPos; i ++){
	ret += this.xbuf[i];
    }
    this.setImePos(ret + this.marginx, 0);
    return ret;
}
Line.prototype.draw = function(ctx){
    ctx.fillStyle = "white";
    ctx.fillRect(this.x , this.y, this.w, this.h);
    
    ctx.strokeStyle = this.forcused?"red":"black";
    ctx.beginPath();
    ctx.rect(this.x , this.y, this.w, this.h);
    ctx.stroke();

    ctx.fillStyle = "black";	
    ctx.fillText(this.buf, this.x + this.marginx, this.y + this.h - 2);

    if(this.forcused){
	ctx.fillStyle = "black";
	var tmpx = this.updateCursor();
	ctx.fillRect(this.x + tmpx + this.marginx, this.y, 1, this.h);
    }
};
Ime = {x:0, y:0};
$(function(){
	// init
	var skk = new SKK();

	function mkTag(tag,contents){
	    var tag = document.createElement(tag);
	    var text = document.createTextNode(contents);
	    tag.appendChild(text);
	    return tag;
	}
	
	var canv = document.getElementById('canv');
	var ctx = canv.getContext('2d');
	ctx.font = "12px 'Times New Roman'";
	
	var cont = new Editor(0, 0, 800, 400, ctx);
	cont.redraw = function(){
	    cont.draw(ctx);
	}
	cont.setImePos = function(x,y){
	    Ime.x = x + this.x;
	    Ime.y = y + this.y;
	}
	cont.draw(ctx);
	
	var debug = document.getElementById('debug');
	$(document).bind('keydown',function(e){
		switch(e.which){
		case 8: // BS
		case 37:
		case 38:
		case 39:
		case 40:
		case 32:
		case 17: // ctrl
		    keySend(e);
		    // ブラウザに食わせない
		    e.preventDefault();
		    e.stopPropagation(); 
		    e.stopImmediatePropagation();
		    if(window.event){
			event.returnValue=false;
			event.cancelBubble=true;
		    }
		    return false;
		    break;
		}
		if(e.ctrlKey){
		    keySend(e);
		    // ブラウザに食わせない
		    e.preventDefault();
		    e.stopPropagation(); 
		    e.stopImmediatePropagation();
		    if(window.event){
			event.returnValue=false;
			event.cancelBubble=true;
		    }
		    return false;
		}
	    });
	$(document).bind('keypress',function(e){
		if(e.which != 8){
		    keySend(e);
		}
		// ブラウザに食わせない
		if(e.which != 116 && e.keyCode != 116){ // F5は通す
		    e.preventDefault();
		    e.stopPropagation(); 
		    e.stopImmediatePropagation();
		    if(window.event){
			event.returnValue=false;
			event.cancelBubble=true;
		    }
		    return false;
		}

	    });
	$(document).bind('keyup',function(e){
		// ブラウザに食わせない
		if(e.which != 116){ // F5は通す
		    e.preventDefault();
		    e.stopPropagation(); 
		    e.stopImmediatePropagation();
		    if(window.event){
			event.returnValue=false;
			event.cancelBubble=true;
		    }
		    return false;
		}
	    });
	function keySend(e){
		// IMEでキーボードを受け取る
		
	    //console.log(e)
		// IME
	    //console.log("IME",Ime.x,Ime.y);
		//ctx.translate(Ime.x,Ime.y);
		
		// IMEへキーを送信
		var c = String.fromCharCode(e.which);
		if(e.which != 16){ // for windows? (16:shift)
		    skk.keytyped(c,e.which,e.shiftKey,e.ctrlKey);
		}
		var s = skk.buf; // IMEからの返り値
		skk.buf = "";
		
		// Sharingにキーを渡す
		if(skk.hMode == skk.HMODE_NONE && s == ""){
		    cont.keydown({key:e.which,isCtrl:e.ctrlKey});
		}
		cont.keytype({key:s,isCtrl:false});
		
		// オーバーレイで変換中文字を表示

		//ctx.fillText(s, 0 + Ime.x , Ime.y + 15);

		var posxext = 0;
		var blue_string = "";
		if(skk.values){ // 変換候補あり
		    // 変換中文字
		    blue_string = skk.values[skk.valuesPos] + skk.postChar;
		    //ctx.fillText(skk.values[skk.valuesPos] + skk.postChar ,0 + Ime.x, Ime.y + 15);
		    posxext = ctx.measureText(skk.values[skk.valuesPos] + skk.postChar).width;
		}else{ // 変換候補なし
		    // 変換中文字
		    blue_string = skk.henkanBuf + skk.postChar;
		    //ctx.fillText(skk.henkanBuf + skk.postChar ,0 + Ime.x, Ime.y + 15);
		    posxext = ctx.measureText(skk.henkanBuf + skk.postChar).width;
		}
		var posxext2 = ctx.measureText(skk.siin).width;
		
		ctx.fillStyle="yellow";
		ctx.fillRect(0 + Ime.x, Ime.y, posxext + posxext2, 15);
		
		ctx.fillStyle="black";
		ctx.fillText(blue_string ,0 + Ime.x, Ime.y + 15);
		// 未確定子音
		ctx.fillStyle="red";
		ctx.fillText(skk.siin , posxext + Ime.x, Ime.y + 15);
		
		//ctx.translate(-Ime.x,-Ime.y);
	}
    });
