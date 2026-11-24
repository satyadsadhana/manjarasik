/* Kota Aksara — mesin permainan: sandi, hash, skor, dan data 10 level.
   Tidak ada jawaban dalam bentuk teks di file ini. Jawaban disimpan sebagai hash SHA-256,
   dan isi hadiah (serpihan & catatan) dikunci dengan jawaban levelnya sendiri. */
(function(root){
  'use strict';
  const AZ='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const normalize=value=>String(value||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z]/g,'');
  const group=text=>(normalize(text).match(/.{1,5}/g)||[]).join(' ');

  // ---------- sandi klasik ----------
  function caesar(text,shift=3){return normalize(text).split('').map(c=>AZ[(AZ.indexOf(c)+shift%26+26)%26]).join('');}
  function atbash(text){return normalize(text).split('').map(c=>AZ[25-AZ.indexOf(c)]).join('');}
  function grid(keyword=''){return [...new Set((normalize(keyword).replace(/J/g,'I')+AZ.replace('J','')).split(''))];}
  function polybius(text,keyword=''){const g=grid(keyword);return normalize(text).replace(/J/g,'I').split('').map(c=>{const p=g.indexOf(c);return `${Math.floor(p/5)+1}${p%5+1}`;}).join(' ');}
  function vigenere(text,key,decrypt=false){const k=normalize(key);if(!k)throw new Error('Kata kunci wajib diisi');const sign=decrypt?-1:1;return normalize(text).split('').map((c,i)=>AZ[(AZ.indexOf(c)+sign*AZ.indexOf(k[i%k.length])+26)%26]).join('');}
  function railPattern(length,rails){const rows=[];let r=0,step=1;for(let i=0;i<length;i++){rows.push(r);if(rails>1){if(r===0)step=1;else if(r===rails-1)step=-1;r+=step;}}return rows;}
  function railFence(text,rails){const t=normalize(text),rows=railPattern(t.length,rails);let out='';for(let r=0;r<rails;r++)for(let i=0;i<t.length;i++)if(rows[i]===r)out+=t[i];return out;}
  function railFenceDecrypt(text,rails){const t=normalize(text),rows=railPattern(t.length,rails),order=[];for(let r=0;r<rails;r++)for(let i=0;i<t.length;i++)if(rows[i]===r)order.push(i);const out=[];order.forEach((pos,k)=>{out[pos]=t[k];});return out.join('');}

  // ---------- SHA-256 sinkron tanpa dependensi ----------
  function sha256(msg){
    const K=[];let n=2;
    while(K.length<64){let prime=true;for(let d=2;d*d<=n;d++)if(n%d===0){prime=false;break;}if(prime)K.push((Math.cbrt(n)%1)*4294967296|0);n++;}
    const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const bytes=utf8(String(msg));const bits=bytes.length*8;bytes.push(0x80);while(bytes.length%64!==56)bytes.push(0);
    for(let i=7;i>=0;i--)bytes.push(i>3?0:(bits>>>(i*8))&255);
    const r=(x,k)=>(x>>>k)|(x<<(32-k));
    for(let o=0;o<bytes.length;o+=64){
      const w=[];
      for(let i=0;i<16;i++)w[i]=(bytes[o+i*4]<<24)|(bytes[o+i*4+1]<<16)|(bytes[o+i*4+2]<<8)|bytes[o+i*4+3];
      for(let i=16;i<64;i++){const s0=r(w[i-15],7)^r(w[i-15],18)^(w[i-15]>>>3),s1=r(w[i-2],17)^r(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0;}
      let [a,b,c,d,e,f,g,h]=H;
      for(let i=0;i<64;i++){const t1=(h+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g))+K[i]+w[i])|0,t2=((r(a,2)^r(a,13)^r(a,22))+((a&b)^(a&c)^(b&c)))|0;h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
      [a,b,c,d,e,f,g,h].forEach((v,i)=>{H[i]=(H[i]+v)|0;});
    }
    return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('');
  }
  function utf8(s){const out=[];for(const ch of s){let c=ch.codePointAt(0);if(c<0x80)out.push(c);else if(c<0x800)out.push(0xc0|c>>6,0x80|c&63);else if(c<0x10000)out.push(0xe0|c>>12,0x80|c>>6&63,0x80|c&63);else out.push(0xf0|c>>18,0x80|c>>12&63,0x80|c>>6&63,0x80|c&63);}return out;}
  function fromUtf8(bytes){let s='';for(let i=0;i<bytes.length;){const b=bytes[i];let c;if(b<0x80){c=b;i+=1;}else if(b<0xe0){c=(b&31)<<6|bytes[i+1]&63;i+=2;}else if(b<0xf0){c=(b&15)<<12|(bytes[i+1]&63)<<6|bytes[i+2]&63;i+=3;}else{c=(b&7)<<18|(bytes[i+1]&63)<<12|(bytes[i+2]&63)<<6|bytes[i+3]&63;i+=4;}s+=String.fromCodePoint(c);}return s;}

  // Hadiah tiap level dikunci dengan aliran kunci SHA-256 dari jawaban (XOR). Hanya jawaban benar yang bisa membukanya.
  function keystream(answer,length){const seed=sha256('kota-aksara:'+normalize(answer));const out=[];for(let block=0;out.length<length;block++){const h=sha256(seed+':'+block);for(let i=0;i<64&&out.length<length;i+=2)out.push(parseInt(h.slice(i,i+2),16));}return out;}
  function seal(text,answer){const data=utf8(text),ks=keystream(answer,data.length);return data.map((b,i)=>(b^ks[i]).toString(16).padStart(2,'0')).join('');}
  function unseal(hex,answer){if(!hex)return '';const data=hex.match(/../g).map(h=>parseInt(h,16)),ks=keystream(answer,data.length);return fromUtf8(data.map((b,i)=>b^ks[i]));}
  const answerHash=answer=>sha256('jawaban:'+normalize(answer));
  const checkAnswer=(q,value)=>!!q&&!!normalize(value)&&answerHash(value)===q.answerHash;
  function openSecret(q,answer){if(!checkAnswer(q,answer))return null;try{return JSON.parse(unseal(q.secret,answer));}catch{return null;}}

  // ---------- data tersegel (dibuat oleh tests/buat-level.cjs) ----------
  /*SEALED-START*/
  const SEALED={
    gerbang:{"c":"FHUPL QGLNR ODP","h":"89380d205b39c486bbfcc49f74caf64ebf98b371784789372552ab75a663a9c9","s":"e514ec9e7dc7a694306ac3e213e573e1c10a5ebdbc57717db44cad976d149a0dd7de2aefe5d49143a34f38a2f498724c12dbb165b7d9474629391e917aa3f7a15ea89ec5f2817a1b7e2f96f98ba9041c70cfd9f2f6b20123dfc43b9845f53c367e9f29fb297819"},
    kolam:{"c":"TVHVI GFQFS OZMTP ZS","h":"0cb5b2b667ac7bfa9815ac448f5d4b58e2a96e0aca5fb8871281226d0936b2e4","s":"281b37fb7940d58367ea73160b2ac1e78eafce6dad394f0273113c55572ab5d6d23e30a229f4bb55cf2deb5f525a3d49c897822a43c6b436f1cfccfaeeb162df682ab030da3616704d8f015ff13c35700ef69c381d94e115ef1192bb714b03e45842e2796f75cf7ef3f5674daa672811c033cf6c4f54ee10bf77097718077c960143eadc8a5c3a203466580f75ad744eae4d24c1d8d1393afd844f64c55f8a28c0650f03f38710c3a92dc8ebf5c8c8d4f80a3904546e0a69d8aebed89cec6722c10de86ab4"},
    menara:{"c":"WHNHY KBHIH YPZ","h":"ba6cdaf3817db585bba69b36319f508f7b70b1131aa4afdd7bc1e4c4bdf64ca5","s":"165300b868d08d3ea01f80eb728b3053426da117256a8b687003795f64cad1e9ce6d9e8e0bdd069228f27a3a5764acb20c87add4a8012adf1deb75b0af984c7af7dda3f9b152c39729496d25d94fce1e23f4b701c73fb032b29b0e2099a5bed0e294231a6afa70028d3f58e9a4177e1041d447dcb0798f2e654e32f79c09f2ac3ace88a4bbd2e59ff44fe22c405f"},
    pagar:{"c":"KTKAP KTKNI OATNA AAUC","h":"9277c5fc507c9eaa0772a32fb808ed31c79d2ed1682358e6b050c2e0bd4c4c34","s":"0da4666c925b19d0117d5bfb4f2d6b050fb615fb61518b59cf8278a9db3294f99ade38008f61021df8b13cbe2cca0e6152d0b896d45249cc297de2fce1b983e13cff92cd67f481e4e8f8ee20bb8057b5e6e8191c7d6fa0a333bba578dc5cdff772f81e66baf5081b3454da85"},
    perpustakaan:{"c":"25 45 33 13 24 33 54 11 15 31 11 42 11","h":"7b20452843403bb807ed3e19908c8f4bc4b30077b51109e46ccee4f40adbb0d0","s":"ccdbd9ea8b0336236477a6e1ff9957194e6fc7903761cd970cd1260bfb91cf0cd9f30e4cfc9ca9a16b5cb4e3e7a60fa46f17d72b0aa1db1bbd75175702b7494ce6463571ceea1d76d5156adb71f3ada860e744e9187568b5e6d2a2a1ffad30b80cb3dd19340f0189734e6944c0bfd70f6f31038fffe8e3d0d644f8bb830d5cf7454a"},
    observatorium:{"c":"XTGRR IWMVN YUUKA QLN","h":"e31386fe04d4d80d1c8c6060857e62ffc00eb21a26aac66a3f020ed73b3d7889","s":"ca977d62add2449352c475887902a20700bf9d55bf42ed14a28546e2e47750606986e29214a05c1585d58c5cc0c61f8b4b2ba7801c98d23a11e61878563431339d34175d503a137d7c7cacb0ccb9faf723bdb61f021256117b452b80a75646a2502ad097b52f4109e0fd836cc90b0b6d47fdbddb309f80b317"},
    rel:{"c":"ATURN GKRUB HAIIT NAMDB A","h":"115a65b67f6882575d6cba29fd894041eca778e2c1e1516693ed1ea0bcf24fc8","s":"613a365fd63ddb2f48c398f1ded1d4fbf88aa8cd2fc5a62bc3ed71baad43d81acc279bd53fbca609ae126e31cdba65a8302d6aeffc3d0736c4a3806c9cbdae1c8024423a2bdaaaeec0de533f7d94c3b173db69e4213e05fa303f0c4e8f1babd6fbc9e9bea01f553221827b98a06f7eee9a015b9e693fb3219ba9006044a862a057895e43b19c4601955b"},
    akar:{"c":"34 45 13 23 45 43 33 15 33 45 22 24 43 34 12 13","h":"62298b480eeb341ce8524350145ae0c98844aab89b78710a08546c1a82613478","s":"7eb29ff138ac7dc5733ed94537b63d9269cd4adf576cc0fdcef122116968fc55c9e6c9a249adf73248489f3c93fc485896b33e77a4a5b9c014aea0deda4cc769a88e34ef6ef09406a5db5250dfdf9b1cdec9298849c6c79e16280688bb7cec938ce3974cd88c088bc07b919cc042c90a67d92d93f28f2eba841de71d5c008223c6"},
    arsip:{"c":"QIPOY IVQER TABIV FADIZ IR","h":"720cfc2d7f7aa52286377162534db4985ed9f4caffd4a14d3db0c0c69a014441","s":"777d361e066cbc14bd833943289a5490f902c779a05671bece5fb45930e7177cae4334de14ff1a9ffba26dc9ee31a70ceccebad8026fd43f9544b4036355183a19da54f67e5cc5c6eb44b4d066ccd2f417b93774d6288e202e5cee7d940d4839599e79debb3918107924142c6ea28622152502b93e633619bdeb7b2360a49d1253c7"},
    fajar:{"c":"YRKAS EAYTK RFJXM ACERC FAUXY AA","h":"023316ecd3158daf715f5afb0e4fb0ac8550cd497ebe8a5269d7e6975a463bed","s":"f217e2c06c489d33cf6900ebf2e8d76d149f21bb1f40a6d2cd6f78ec3e40276df391a571709bf523b63f7cfce132dac5b6524fd35367e97e8e9abf10db1cc18c68bc0902fb56789a07d148e1f3dd78e6d3ad1cbd14bb487e8a5ea7281c6ed5c9305c117694e787f7d6609d9e38f1b6d97785df2270d2c98cc5d21534060055617a6b0e9b790f3b79b5af046bcee7e0ba7888945b81916775568b2c288e4ef2304a4d8bf0250a8d9218c298c8"}
  };
  /*SEALED-END*/

  // ---------- 10 level berantai ----------
  const LEVELS=[
    {id:'gerbang',name:'Gerbang Kota',subtitle:'Papan kayu di palang gerbang',cipher:'Caesar',type:'caesar-known',scene:'city',color:'gold',symbol:'sun',key:'Kunci Gerbang',
     clue:'Tiga langkah ke belakang membuka gerbang.',
     text:'Gerbang Kota Aksara tertutup kabut. Pada palangnya tergantung papan kayu bertuliskan huruf-huruf aneh. Di bawahnya, Elara meninggalkan pesan pertama: “Setiap huruf kugeser tiga langkah ke depan. Mundurkan tiga langkah, dan kamu akan tahu ke mana harus pergi.”',
     hints:['Mundurkan setiap huruf tiga langkah, misalnya F → E → D → C.','Alfabet berputar: jika mundur melewati A, lanjutkan dari Z. Jawabannya menyebut sebuah tempat di kota.'],
     method:'Caesar mengganti setiap huruf dengan huruf lain pada jarak tetap. Di gerbang ini jaraknya diberitahukan: tiga langkah.',
     reward:'Palang gerbang terangkat perlahan. Kabut di jalan utama menipis, cukup untuk melihat kilau air di tengah kota.'},
    {id:'kolam',name:'Kolam Cermin',subtitle:'Huruf terbalik di dasar air',cipher:'Atbash',type:'atbash',scene:'sky',color:'blue',symbol:'star',key:'Kunci Air',
     clue:'Yang pertama menjadi yang terakhir.',
     text:'Permukaan Kolam Cermin diam seperti kaca. Di dasarnya terukir huruf-huruf yang tampak terbalik. Pada batu di tepi kolam, Elara menulis: “Air memantulkan segalanya terbalik. Yang pertama menjadi yang terakhir, dan pesan ini menyimpan angka untuk menara.”',
     hints:['Tukar huruf pertama alfabet dengan yang terakhir: A ↔ Z, B ↔ Y, C ↔ X, dan seterusnya.','Jawabannya memuat sebuah angka yang ditulis dengan huruf. Angka itu kunci level berikutnya.'],
     method:'Atbash membalik urutan alfabet. Karena pasangannya simetris, cara mengenkripsi dan mendekripsinya sama.',
     reward:'Permukaan kolam beriak. Dari dasarnya naik sebuah kunci perak, dan bayangan menara tampak jelas di air.'},
    {id:'menara',name:'Menara Angin',subtitle:'Lonceng yang lupa hitungannya',cipher:'Caesar',type:'caesar-hidden',scene:'city',color:'rose',symbol:'door',key:'Kunci Lonceng',
     clue:'Kolam sudah membisikkan jaraknya.',
     text:'Di puncak Menara Angin, loncengnya tak lagi berbunyi. Sebuah kotak kuningan menunggumu. Tulisan Elara di tutupnya berbunyi: “Huruf-huruf ini melangkah maju sejauh angka yang dibisikkan kolam. Mundurkan mereka, dan kamu akan tahu cara membaca pagar.”',
     hints:['Besar geseran ada di jawaban Kolam Cermin.','Mundurkan setiap huruf sebanyak angka itu. Jawabannya menyebut jenis sandi di level berikutnya.'],
     method:'Caesar mengganti setiap huruf dengan huruf lain pada jarak tetap. Jarak di menara ini tidak ditulis di sini; kamu harus membawanya dari level sebelumnya.',
     reward:'Lonceng menara berdentang tujuh kali. Dari dalam kotak kuningan, selain kunci, kamu menemukan secarik serpihan batu bertulisan.'},
    {id:'pagar',name:'Pagar Kebun',subtitle:'Pesan zig-zag di bilah kayu',cipher:'Rail Fence',type:'rail',scene:'garden',color:'green',symbol:'leaf',key:'Kunci Pagar',
     clue:'Huruf-huruf melompat naik dan turun.',
     text:'Pagar kebun tua ini dipenuhi huruf yang dicat di bilah-bilahnya. Barisnya tampak acak. Di tiang pagar, Elara menempelkan catatan: “Pesan ini kutulis zig-zag di antara bilah pagar. Penjaga menara sudah menyebut berapa banyak barisnya.”',
     hints:['Jumlah baris (rel) ada di jawaban Menara Angin.','Pesan ini 19 huruf. Dengan 2 rel, 10 huruf pertama adalah rel atas dan 9 sisanya rel bawah. Baca bergantian: atas, bawah, atas, bawah.'],
     method:'Rail Fence (sandi pagar) menulis pesan zig-zag di beberapa baris, lalu membaca baris demi baris. Untuk membukanya, potong pesan sesuai jumlah huruf di tiap baris, lalu baca mengikuti pola zig-zag.',
     reward:'Bilah-bilah pagar bergeser membentuk pintu kecil. Di baliknya, jalan setapak menuju bangunan batu penuh rak.'},
    {id:'perpustakaan',name:'Perpustakaan Batu',subtitle:'Rak bernomor baris dan kolom',cipher:'Polybius',type:'polybius-plain',scene:'archive',color:'gold',symbol:'book',key:'Kunci Rak',
     clue:'Baris lebih dulu, baru kolom.',
     text:'Perpustakaan Batu sunyi. Setiap rak diberi nomor baris dan kolom, dan sebuah daftar angka tergeletak di meja penjaga. Elara menulis di sampulnya: “Rak-rak ini disusun dalam kotak lima kali lima, polos, tanpa kata kunci. Baca baris lebih dulu, baru kolom.”',
     hints:['Susun alfabet biasa di kotak 5×5, dengan I dan J dalam satu sel. Baris 1 berisi A B C D E.','Angka pertama adalah baris, angka kedua kolom. Contoh: 25 = K dan 45 = U.'],
     method:'Polybius mengubah setiap huruf menjadi pasangan koordinat: angka pertama baris, angka kedua kolom. Di sini kotaknya disusun dari alfabet biasa tanpa kata kunci.',
     reward:'Satu rak berderit dan bergeser. Di baliknya tersimpan kunci dan serpihan batu kedua, dengan ukiran yang serupa dengan serpihan pertama.'},
    {id:'observatorium',name:'Observatorium',subtitle:'Langkah yang mengikuti sebuah nama',cipher:'Vigenère',type:'vigenere',scene:'sky',color:'blue',symbol:'star',key:'Kunci Langit',
     clue:'Nama penulis surat ini membuka langit.',
     text:'Tangga spiral membawamu ke kubah observatorium. Teleskopnya mengarah ke selembar peta bintang yang penuh huruf. Elara menulis di pinggirnya: “Sandi ini tidak berjalan dengan satu langkah yang sama. Langkahnya mengikuti sebuah nama, dan rak perpustakaan sudah menyebutnya.”',
     hints:['Kata kuncinya ada di jawaban Perpustakaan Batu.','Ulangi kata kunci sepanjang pesan, lalu kurangi nilai huruf sandi dengan nilai huruf kunci (A = 0). Jika hasilnya negatif, tambahkan 26.'],
     method:'Vigenère memakai pergeseran berbeda untuk setiap huruf, mengikuti huruf-huruf kata kunci yang diulang. Dekripsi: (nilai sandi − nilai kunci + 26) mod 26.',
     reward:'Kubah observatorium terbuka. Dari kejauhan terlihat jalur rel tua yang berkelok menuju taman.'},
    {id:'rel',name:'Jalur Rel Tua',subtitle:'Tiga rel yang berkelok',cipher:'Rail Fence',type:'rail',scene:'city',color:'rose',symbol:'compass',key:'Kunci Rel',
     clue:'Naik, turun, naik lagi, di antara tiga jalur.',
     text:'Jalur rel tua ini sudah lama tak dilewati kereta. Di antara bantalannya, huruf-huruf tersusun dalam deretan panjang. Pada papan sinyal, Elara menulis: “Pesan ini berjalan naik-turun di antara rel yang disebut bintang. Ikuti kelokannya.”',
     hints:['Jumlah rel ada di jawaban Observatorium.','Gambar pola zig-zag dengan titik sebanyak jumlah huruf. Hitung berapa titik di tiap rel, potong pesan sesuai jumlah itu, lalu baca mengikuti zig-zag.'],
     method:'Rail Fence dengan lebih dari dua rel. Pola zig-zag turun dari rel atas ke rel bawah, lalu naik lagi. Baca rel per rel saat enkripsi; balik prosesnya saat dekripsi.',
     reward:'Sinyal rel menyala hijau. Di kotak sinyal, kamu menemukan kunci dan serpihan batu ketiga.'},
    {id:'akar',name:'Taman Akar',subtitle:'Peti batu bertabur angka',cipher:'Polybius',type:'polybius-key',scene:'garden',color:'green',symbol:'leaf',key:'Kunci Akar',
     clue:'Tanah mengingat kata dari langit.',
     text:'Di taman yang ditinggalkan, akar pohon melingkari sebuah peti batu bertabur angka. Ukiran kotak lima kali lima tampak di permukaannya, tetapi hurufnya sudah terkikis. Elara menggores di tepinya: “Kotak ini kususun dengan kata terakhir yang kau temukan di rel. Baca baris lebih dulu, baru kolom.”',
     hints:['Kata kunci kotak ini adalah kata terakhir dari jawaban Jalur Rel Tua.','Tulis huruf unik kata kunci di awal kotak, lanjutkan dengan sisa alfabet secara urut, dan gabungkan I/J dalam satu sel.'],
     method:'Polybius dengan kata kunci: kotak disusun dari huruf unik kata kunci, lalu dilanjutkan sisa alfabet. Kata kunci peti ini tidak ditulis di sini.',
     reward:'Akar-akar bergerak perlahan, memberi jalan ke peti batu. Di dalamnya ada kunci hijau dan sebuah catatan tentang dua langkah.'},
    {id:'arsip',name:'Arsip Senja',subtitle:'Surat yang dikunci dua kali',cipher:'Atbash + Caesar',type:'double',scene:'archive',color:'gold',symbol:'book',key:'Kunci Senja',
     clue:'Ikuti urutan yang diajarkan akar.',
     text:'Lampu di ruang arsip tinggal satu. Di antara lembaran tua, kamu menemukan surat terakhir Elara, dikunci dua kali. Catatan di amplopnya berbunyi: “Aku membalik pesan ini seperti cermin, lalu menggesernya. Berapa jauhnya, aku tak akan bilang. Akar sudah mengajarimu urutan untuk membukanya.”',
     hints:['Jawaban Taman Akar menyebut urutan membukanya.','Mundurkan semua huruf dengan geseran yang sama (coba 1 sampai 25), lalu balik hasilnya dengan Atbash. Hentikan saat muncul kata Indonesia.'],
     method:'Sandi ganda: pesan dienkripsi dengan Atbash, lalu Caesar dengan geseran rahasia. Untuk membuka, kerjakan dari lapisan terakhir: Caesar dulu, baru Atbash.',
     reward:'Surat Elara berpendar. Dari lipatannya jatuh kunci tembaga dan serpihan batu terakhir. Keempat serpihan kini terasa hangat di tanganmu.'},
    {id:'fajar',name:'Ruang Fajar',subtitle:'Pintu terakhir menuju lentera',cipher:'Vigenère + Rail Fence',type:'final',scene:'sky',color:'rose',symbol:'sun',key:'Lentera Aksara',final:true,
     clue:'Serpihan yang disatukan menjadi satu nama.',
     text:'Pintu batu Ruang Fajar dipenuhi huruf yang berkelok naik-turun. Di tengahnya ada empat ceruk kecil seukuran serpihan batu. Ukiran Elara di ambang pintu berbunyi: “Tiga rel menjaga pintu ini, dan nama negeri kita menjaga kuncinya. Satukan serpihanmu sesuai nomornya.”',
     hints:['Kata kunci Vigenère adalah gabungan keempat serpihan, sesuai urutan nomornya.','Pesan ini dikunci dua lapis: Vigenère, lalu Rail Fence tiga rel. Buka dari lapisan terakhir: Rail Fence dulu, baru Vigenère.'],
     method:'Sandi ganda terakhir: Vigenère dengan kata kunci dari serpihan, lalu Rail Fence tiga rel. Bukalah dari lapisan terakhir.',
     reward:'Keempat serpihan menyatu di ceruk pintu. Pintu Ruang Fajar terbuka tanpa suara.'}
  ];
  const POINTS=[100,150,200,250,300,350,400,450,500,600];
  const FRAGMENT_LEVELS=['menara','perpustakaan','rel','arsip'];
  const quests=LEVELS.map((q,i)=>Object.assign({},q,{
    number:String(i+1).padStart(2,'0'),level:i+1,points:POINTS[i],tier:Math.ceil((i+1)/2),
    fragment:FRAGMENT_LEVELS.indexOf(q.id)+1||null,
    ciphertext:(SEALED[q.id]||{}).c||'',answerHash:(SEALED[q.id]||{}).h||'',secret:(SEALED[q.id]||{}).s||''
  }));
  const MAX_SCORE=POINTS.reduce((a,b)=>a+b,0);
  const HINT_PENALTY=0.2, WRONG_PENALTY=10;
  function levelScore(q,hints=0,wrong=0){const p=q.points;return Math.max(Math.round(p*0.2),Math.round(p-p*HINT_PENALTY*Math.min(hints,q.hints.length)-WRONG_PENALTY*wrong));}
  function maxLevelScore(q,hints=0,wrong=0){return levelScore(q,hints,wrong);}

  // ---------- progres ----------
  const int=v=>Number.isInteger(v)&&v>=0?v:0;
  function validateState(raw){
    const s=raw&&typeof raw==='object'?raw:{};
    const answers={},hints={},wrong={},scores={};
    const ra=s.answers&&typeof s.answers==='object'?s.answers:{};
    const rh=s.hints&&typeof s.hints==='object'?s.hints:{};
    const rw=s.wrong&&typeof s.wrong==='object'?s.wrong:{};
    const solved=[];
    for(const q of quests){
      hints[q.id]=Math.min(q.hints.length,int(rh[q.id]));
      wrong[q.id]=Math.min(999,int(rw[q.id]));
      const prevOk=q.level===1||solved.includes(quests[q.level-2].id);
      if(prevOk&&typeof ra[q.id]==='string'&&checkAnswer(q,ra[q.id])){answers[q.id]=normalize(ra[q.id]);solved.push(q.id);scores[q.id]=levelScore(q,hints[q.id],wrong[q.id]);}
    }
    const team=typeof s.team==='string'&&s.team.trim()?s.team.trim().slice(0,24):'';
    const teamId=typeof s.teamId==='string'&&/^[a-z0-9-]{4,48}$/.test(s.teamId)?s.teamId:'';
    const startedAt=int(s.startedAt);
    const finished=s.finished===true&&solved.length===quests.length;
    return {team,teamId,introDone:s.introDone===true,storyPage:Number.isInteger(s.storyPage)?Math.max(0,Math.min(3,s.storyPage)):0,
      answers,hints,wrong,scores,solved,startedAt,finishedAt:finished?int(s.finishedAt):0,finished};
  }
  const totalScore=state=>Object.values(state.scores||{}).reduce((a,b)=>a+b,0);
  const isUnlocked=(state,q)=>q.level===1||state.solved.includes(quests[q.level-2].id);
  function canUnlock(ids){return quests.every(q=>Array.isArray(ids)&&ids.includes(q.id));}
  function fragments(state){return quests.filter(q=>q.fragment).map(q=>{const sec=state.solved.includes(q.id)?openSecret(q,state.answers[q.id]):null;return {n:q.fragment,from:q,text:sec&&sec.fragment||''};});}
  function rankBoard(entries){return [...entries].sort((a,b)=>b.score-a.score||b.solved-a.solved||(a.elapsedMs||Infinity)-(b.elapsedMs||Infinity)||String(a.team).localeCompare(String(b.team)));}

  const api={AZ,normalize,group,caesar,atbash,grid,polybius,vigenere,railFence,railFenceDecrypt,railPattern,sha256,seal,unseal,answerHash,checkAnswer,openSecret,
    quests,POINTS,MAX_SCORE,HINT_PENALTY,WRONG_PENALTY,levelScore,maxLevelScore,validateState,totalScore,isUnlocked,canUnlock,fragments,rankBoard};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StoryEngine=api;
})(typeof window!=='undefined'?window:globalThis);
