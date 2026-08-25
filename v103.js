/* Rozliczenia Warsztatów v10.3 */
(function(){
"use strict";

function applyActiveStatus103(root=document){
  const walker=document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node){
        const parent=node.parentElement;
        if(!parent)return NodeFilter.FILTER_REJECT;
        if(parent.closest("script,style,textarea,input,select,option"))return NodeFilter.FILTER_REJECT;
        const text=(node.nodeValue||"").trim();
        return text==="Aktywne" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);

  nodes.forEach(node=>{
    const raw=node.nodeValue||"";
    node.nodeValue=raw.replace(/\bAktywne\b/g,"🟢 Aktywne");
  });
}

const observer103=new MutationObserver(()=>{
  applyActiveStatus103(document);
});

observer103.observe(document.body,{childList:true,subtree:true,characterData:true});
setTimeout(()=>applyActiveStatus103(document),0);

window.RWModules=window.RWModules||{};
window.RWModules.activeStatus={version:"10.3",label:"🟢 Aktywne"};
})();