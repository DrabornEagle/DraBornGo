import React, { memo, useMemo } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { minimalLootUi as ui } from '../../theme/minimalLootUi';

function MenuRow({ icon, label, sub, onPress }) { return <Pressable onPress={onPress} style={{minHeight:72,borderRadius:18,backgroundColor:ui.colors.panel2,borderWidth:1,borderColor:ui.colors.line,paddingHorizontal:14,paddingVertical:12,flexDirection:'row',alignItems:'center',marginBottom:10}}><View style={{width:42,height:42,borderRadius:14,backgroundColor:'rgba(123,230,255,0.12)',alignItems:'center',justifyContent:'center'}}><MaterialCommunityIcons name={icon} size={20} color={ui.colors.cyan}/></View><View style={{flex:1,marginLeft:12}}><Text style={{color:ui.colors.text,fontSize:15,fontWeight:'900'}}>{label}</Text><Text style={{color:ui.colors.soft,fontSize:12,fontWeight:'700',marginTop:3}}>{sub}</Text></View><MaterialCommunityIcons name="chevron-right" size={22} color={ui.colors.soft}/></Pressable>; }

function ActionMenuModal({ visible,onClose,isAdmin,canCourier,onCourier,onProfile,onDBGHub,onAdmin,onLegalCenter,onLogout }) {
  const dkd_items_value = useMemo(() => [
    {icon:'account-circle-outline',label:'Profil',sub:'Kimlik, profil görseli, kurye ve işletme durumunu yönet',onPress:()=>{onClose?.();onProfile?.();}},
    canCourier ? {icon:'truck-fast-outline',label:'Kurye Merkezi',sub:'Kurye durumunu ve teslimat operasyonunu aç',onPress:()=>{onClose?.();onCourier?.();}} : null,
    {icon:'message-badge-outline',label:'Sohbet Merkezi',sub:'Arkadaş, DM ve ekip sohbetini aç',onPress:()=>{onClose?.();onDBGHub?.();}},
    {icon:'shield-account-outline',label:'Gizlilik ve Veri Merkezi',sub:'İzinler, gizlilik, hesap ve veri silme bilgileri',onPress:()=>{onClose?.();onLegalCenter?.();}},
    isAdmin ? {icon:'shield-crown-outline',label:'Admin',sub:'Operasyon ve yönetim araçlarını aç',onPress:()=>{onClose?.();onAdmin?.();}} : null,
    {icon:'logout',label:'Çıkış yap',sub:'Hesaptan güvenli şekilde ayrıl',onPress:()=>{onClose?.();onLogout?.();}},
  ].filter(Boolean), [canCourier,isAdmin,onClose,onCourier,onProfile,onDBGHub,onAdmin,onLegalCenter,onLogout]);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable onPress={onClose} style={{flex:1,backgroundColor:'rgba(2,4,10,0.80)',justifyContent:'center',padding:12}}><Pressable onPress={()=>{}} style={{maxHeight:'92%',borderRadius:28,backgroundColor:ui.colors.bgSoft,borderWidth:1,borderColor:ui.colors.line,padding:16}}><View style={{flexDirection:'row',alignItems:'center',marginBottom:16}}><View style={{flex:1}}><Text style={{color:ui.colors.cyan,fontSize:11,fontWeight:'900',letterSpacing:1}}>MENÜ</Text><Text style={{color:ui.colors.text,fontSize:25,fontWeight:'900',marginTop:4}}>DraBornGo Merkezi</Text></View><Pressable onPress={onClose} style={{width:44,height:44,borderRadius:15,backgroundColor:ui.colors.panel2,alignItems:'center',justifyContent:'center'}}><MaterialCommunityIcons name="close" size={22} color={ui.colors.text}/></Pressable></View><ScrollView showsVerticalScrollIndicator={false}>{dkd_items_value.map((dkd_item_value)=><MenuRow key={dkd_item_value.label} {...dkd_item_value}/>)}</ScrollView></Pressable></Pressable></Modal>;
}
export default memo(ActionMenuModal);
