(function(root){
  'use strict';
  const RULES=Object.freeze({count:30,minutes:60,pass:20});
  function randomIndex(n){
    const a=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;
    do{root.crypto.getRandomValues(a);}while(a[0]>=limit);
    return a[0]%n;
  }
  function shuffle(items){const out=items.slice();for(let i=out.length-1;i>0;i--){const j=randomIndex(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
  function createExam(bank,minutes=RULES.minutes,now=Date.now()){
    if(bank.length<RULES.count)throw new Error('Banco insuficiente para sortear 30 questões.');
    return {version:1,startedAt:now,deadline:now+minutes*60000,minutes,index:0,finishedAt:null,questions:shuffle(bank).slice(0,RULES.count).map(q=>({...q,answers:shuffle(q.answers)})),answers:Array(RULES.count).fill(null),flags:Array(RULES.count).fill(false)};
  }
  function remaining(exam,now=Date.now()){return Math.max(0,Math.ceil((exam.deadline-now)/1000));}
  function score(exam){return exam.questions.reduce((n,q,i)=>n+(q.answers[exam.answers[i]]?.is_correct===true?1:0),0);}
  function validExam(exam){return exam?.version===1&&Array.isArray(exam.questions)&&exam.questions.length===30&&Array.isArray(exam.answers)&&exam.answers.length===30&&Array.isArray(exam.flags)&&exam.flags.length===30&&[60,120].includes(exam.minutes)&&Number.isFinite(exam.deadline)&&Number.isFinite(exam.startedAt)&&exam.deadline===exam.startedAt+exam.minutes*60000&&Number.isInteger(exam.index)&&exam.index>=0&&exam.index<30&&exam.questions.every(q=>typeof q.title==='string'&&Array.isArray(q.answers)&&q.answers.length===4&&q.answers.every(a=>typeof a.text==='string')&&q.answers.filter(a=>a.is_correct===true).length===1&&Array.isArray(q.signs))&&exam.answers.every(a=>a===null||(Number.isInteger(a)&&a>=0&&a<4))&&exam.flags.every(a=>typeof a==='boolean')&&(exam.finishedAt===null||Number.isFinite(exam.finishedAt));}
  root.QuizCore={RULES,shuffle,createExam,remaining,score,validExam};
})(globalThis);
