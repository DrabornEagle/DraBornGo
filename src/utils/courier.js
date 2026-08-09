export const COURIER_STATUS_META = {
  none:{key:'none',label:'Başvuru Bekliyor',shortLabel:'Hazır',toneBg:'rgba(255,255,255,0.08)',toneText:'#FFFFFF'},
  pending:{key:'pending',label:'Başvuru İncelemede',shortLabel:'Onay Bekliyor',toneBg:'rgba(255,193,7,0.18)',toneText:'#FFE9A8'},
  approved:{key:'approved',label:'Kurye Onayı Aktif',shortLabel:'Kurye Onaylı',toneBg:'rgba(33,212,253,0.18)',toneText:'#DFF8FF'},
  rejected:{key:'rejected',label:'Başvuru Reddedildi',shortLabel:'Red',toneBg:'rgba(255,99,132,0.16)',toneText:'#FFD7E0'},
  suspended:{key:'suspended',label:'Kurye Hesabı Askıda',shortLabel:'Askıda',toneBg:'rgba(255,99,132,0.16)',toneText:'#FFD7E0'},
};
export function getCourierMeta(profile={}){
  const status=String(profile?.courier_status||'none').toLowerCase();
  const completed=Math.max(0,Number(profile?.courier_completed_jobs||0));
  const base=COURIER_STATUS_META[status]||COURIER_STATUS_META.none;
  let description='Kurye başvurusu oluşturabilirsin.';
  if(status==='pending')description='Başvurun yönetim incelemesinde.';
  if(status==='approved')description='Kurye onayın aktif.';
  if(status==='rejected')description='Başvurun reddedildi.';
  if(status==='suspended')description='Kurye hesabın geçici olarak askıda.';
  return {status,completed,label:base.label,shortLabel:base.shortLabel,description,toneBg:base.toneBg,toneText:base.toneText};
}
