import React, { memo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { dkd_render_support_panel_modal } from '../support/dkd_support_panel_conversation';

const dkd_version_text_value = 'DKD_DraBornGo_v0.0.7';

function DkdHomeCard({ dkd_title_value, dkd_subtitle_value, dkd_icon_value, dkd_badge_value, dkd_colors_value, dkd_on_press_value }) {
  return (
    <Pressable onPress={dkd_on_press_value} style={({ pressed }) => [styles.dkd_card_shell, pressed && styles.dkd_pressed]}>
      <LinearGradient colors={dkd_colors_value} style={styles.dkd_card_fill}>
        <View style={styles.dkd_card_icon_row}>
          <View style={styles.dkd_icon_group}><MaterialCommunityIcons name={dkd_icon_value} size={24} color="#B9F8FF" /></View>
          {dkd_badge_value ? <View style={styles.dkd_badge}><Text style={styles.dkd_badge_text}>{dkd_badge_value}</Text></View> : null}
        </View>
        <Text style={styles.dkd_card_title}>{dkd_title_value}</Text>
        <Text style={styles.dkd_card_subtitle}>{dkd_subtitle_value}</Text>
        <View style={styles.dkd_card_cta}><MaterialCommunityIcons name="gesture-tap" size={18} color="#092032" /><Text style={styles.dkd_card_cta_text}>Tıkla</Text></View>
      </LinearGradient>
    </Pressable>
  );
}

function MapHomeScreen({ profile, currentLocation, locationError, retryLocation, onTabChange, onOpenActionMenu, onOpenCourierBoard, onOpenProfile, dkd_on_toggle_courier_online_value }) {
  const [dkd_support_open_value, dkd_set_support_open_value] = useState(false);
  const dkd_avatar_url_value = String(profile?.avatar_image_url || '').trim();
  const dkd_avatar_emoji_value = String(profile?.avatar_emoji || '🦅');
  const dkd_nickname_value = String(profile?.nickname || 'DrabornEagle');
  const dkd_courier_approved_value = String(profile?.courier_status || '').toLowerCase() === 'approved';
  const dkd_courier_online_value = profile?.dkd_courier_online === true;
  const dkd_location_text_value = String(profile?.dkd_city || profile?.courier_city || 'Ankara');

  return (
    <View style={styles.dkd_root}>
      <LinearGradient colors={['#030711', '#071528', '#07101D']} style={StyleSheet.absoluteFill} />
      <View style={styles.dkd_orb_top} />
      <View style={styles.dkd_orb_bottom} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.dkd_scroll}>
        <View style={styles.dkd_identity_card}>
          <LinearGradient colors={['rgba(8,15,28,0.98)','rgba(7,13,24,0.98)']} style={StyleSheet.absoluteFill} />
          <Pressable onPress={onOpenProfile} style={styles.dkd_avatar_shell}>
            {dkd_avatar_url_value ? <Image source={{ uri: dkd_avatar_url_value }} style={styles.dkd_avatar_image} contentFit="cover" /> : <Text style={styles.dkd_avatar_emoji}>{dkd_avatar_emoji_value}</Text>}
          </Pressable>
          <View style={styles.dkd_identity_copy}>
            <View style={styles.dkd_version_row}><Text style={styles.dkd_brand}>DraBornGo</Text><View style={styles.dkd_version_badge}><Text style={styles.dkd_version_text}>{dkd_version_text_value}</Text></View></View>
            <Text style={styles.dkd_name} numberOfLines={1}>{dkd_nickname_value}</Text>
            <Text style={styles.dkd_identity_sub}>Şehir ağı hesabı • {dkd_location_text_value}</Text>
          </View>
          <Pressable onPress={onOpenActionMenu} style={styles.dkd_menu_button}><MaterialCommunityIcons name="menu" size={29} color="#FFFFFF" /></Pressable>
        </View>

        <View style={styles.dkd_status_card}>
          <LinearGradient colors={dkd_courier_online_value ? ['rgba(7,92,78,0.82)','rgba(13,34,63,0.96)','rgba(42,20,68,0.92)'] : ['rgba(94,28,47,0.72)','rgba(31,28,58,0.95)','rgba(12,42,58,0.92)']} style={StyleSheet.absoluteFill} />
          <View style={styles.dkd_status_head}><View style={styles.dkd_status_icon}><MaterialCommunityIcons name={dkd_courier_approved_value ? 'motorbike' : 'card-account-details-outline'} size={30} color="#091622" /></View><View style={{flex:1}}><Text style={styles.dkd_status_kicker}>KURYE DURUMU</Text><Text style={styles.dkd_status_title}>{dkd_courier_approved_value ? (dkd_courier_online_value ? 'ÇEVRİMİÇİ' : 'ÇEVRİMDIŞI') : 'BAŞVURU BEKLİYOR'}</Text></View></View>
          <Text style={styles.dkd_status_sub}>{dkd_courier_approved_value ? 'Kurye operasyon durumunu ve aktif teslimatlarını buradan yönet.' : 'Kurye başvurusu ve lisans durumunu merkezden takip et.'}</Text>
          <View style={styles.dkd_status_bottom}><View style={styles.dkd_location_chip}><MaterialCommunityIcons name="map-marker-outline" size={18} color="#7BE6FF" /><Text style={styles.dkd_location_text}>{dkd_location_text_value}</Text></View>{dkd_courier_approved_value ? <Pressable onPress={dkd_on_toggle_courier_online_value} style={styles.dkd_status_button}><Text style={styles.dkd_status_button_text}>{dkd_courier_online_value ? 'Çevrimdışı Ol' : 'Çevrimiçi Ol'}</Text><MaterialCommunityIcons name="chevron-double-right" size={20} color="#07111C" /></Pressable> : <Pressable onPress={() => onOpenCourierBoard?.('application')} style={styles.dkd_status_button}><Text style={styles.dkd_status_button_text}>Merkezi Aç</Text><MaterialCommunityIcons name="chevron-double-right" size={20} color="#07111C" /></Pressable>}</View>
        </View>

        {locationError ? <Pressable onPress={retryLocation} style={styles.dkd_location_error}><MaterialCommunityIcons name="crosshairs-question" size={18} color="#FFD66B" /><Text style={styles.dkd_location_error_text}>Konum alınamadı. Tekrar dene.</Text></Pressable> : null}

        <Pressable onPress={() => dkd_set_support_open_value(true)} style={styles.dkd_support_button}><LinearGradient colors={['#1E3A8A','#7C3AED','#DB2777']} style={styles.dkd_support_fill}><MaterialCommunityIcons name="face-agent" size={24} color="#FFFFFF" /><Text style={styles.dkd_support_text}>Destek Paneli</Text></LinearGradient></Pressable>

        <DkdHomeCard dkd_title_value="Kurye Operasyon Merkezi" dkd_subtitle_value="Kurye durumunu, gönderi panelini ve işletme sipariş akışını tek merkezden yönet." dkd_icon_value="truck-fast-outline" dkd_badge_value="PAKETLER" dkd_colors_value={['rgba(7,80,93,0.94)','rgba(45,52,133,0.92)','rgba(95,28,77,0.90)']} dkd_on_press_value={() => onOpenCourierBoard?.('default')} />
        <DkdHomeCard dkd_title_value="Hizmet Ağı Merkezi" dkd_subtitle_value="Şehiriçi ve şehirlerarası hizmet, yemek, market, ulaşım ve işletme ağını tek merkezde aç." dkd_icon_value="storefront-outline" dkd_badge_value="HİZMET" dkd_colors_value={['rgba(14,87,66,0.94)','rgba(10,103,113,0.93)','rgba(75,40,192,0.90)']} dkd_on_press_value={() => onTabChange?.('serviceNetwork')} />

        <View style={styles.dkd_grid}>
          <Pressable onPress={() => onTabChange?.('applications')} style={[styles.dkd_grid_card, styles.dkd_grid_teal]}><View style={styles.dkd_grid_icons}><MaterialCommunityIcons name="motorbike" size={26} color="#9AF8FF" /><MaterialCommunityIcons name="truck-outline" size={24} color="#FFE074" /></View><Text style={styles.dkd_grid_title}>Başvurular</Text><Text style={styles.dkd_grid_sub}>Kurye, nakliye ve işletme başvurularını yönet.</Text></Pressable>
          <Pressable onPress={() => onTabChange?.('dbg')} style={[styles.dkd_grid_card, styles.dkd_grid_pink]}><View style={styles.dkd_grid_icons}><MaterialCommunityIcons name="message-text-outline" size={27} color="#FFD8F0" /><MaterialCommunityIcons name="account-group-outline" size={24} color="#FFE074" /></View><Text style={styles.dkd_grid_title}>Sohbet</Text><Text style={styles.dkd_grid_sub}>DBG mesaj ve ekip sohbetini aç.</Text></Pressable>
        </View>
        <View style={styles.dkd_bottom_space} />
      </ScrollView>
      {dkd_render_support_panel_modal({ dkd_visible_value: dkd_support_open_value, dkd_on_close_value: () => dkd_set_support_open_value(false), dkd_profile_value: profile, dkd_current_location_value: currentLocation })}
    </View>
  );
}

const styles = StyleSheet.create({
  dkd_root:{flex:1,backgroundColor:'#030711'}, dkd_scroll:{padding:18,paddingBottom:40,gap:16},
  dkd_orb_top:{position:'absolute',right:-120,top:-130,width:320,height:320,borderRadius:999,backgroundColor:'rgba(39,92,255,0.12)'},
  dkd_orb_bottom:{position:'absolute',left:-160,bottom:120,width:360,height:360,borderRadius:999,backgroundColor:'rgba(158,54,255,0.10)'},
  dkd_identity_card:{minHeight:136,borderRadius:28,borderWidth:1,borderColor:'rgba(126,153,200,0.22)',overflow:'hidden',padding:18,flexDirection:'row',alignItems:'flex-start'},
  dkd_avatar_shell:{width:96,height:96,borderRadius:30,borderWidth:1,borderColor:'rgba(255,255,255,0.14)',backgroundColor:'rgba(255,255,255,0.05)',overflow:'hidden',alignItems:'center',justifyContent:'center'}, dkd_avatar_image:{width:'100%',height:'100%'},dkd_avatar_emoji:{fontSize:43},
  dkd_identity_copy:{flex:1,marginLeft:16,minWidth:0},dkd_version_row:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:7},dkd_brand:{color:'#67E8F9',fontSize:12,fontWeight:'900',letterSpacing:1},dkd_version_badge:{paddingHorizontal:10,paddingVertical:5,borderRadius:999,borderWidth:1,borderColor:'rgba(255,215,120,0.36)',backgroundColor:'rgba(255,201,84,0.10)'},dkd_version_text:{color:'#FFE29A',fontSize:10,fontWeight:'900'},dkd_name:{color:'#FFFFFF',fontSize:28,fontWeight:'900',marginTop:6},dkd_identity_sub:{color:'rgba(232,239,255,0.70)',fontSize:14,fontWeight:'700',marginTop:4},
  dkd_menu_button:{width:58,height:58,borderRadius:20,borderWidth:1,borderColor:'rgba(255,255,255,0.12)',backgroundColor:'rgba(255,255,255,0.05)',alignItems:'center',justifyContent:'center'},
  dkd_status_card:{borderRadius:28,borderWidth:1,borderColor:'rgba(123,230,255,0.18)',overflow:'hidden',padding:22},dkd_status_head:{flexDirection:'row',alignItems:'center',gap:16},dkd_status_icon:{width:68,height:68,borderRadius:24,backgroundColor:'#FF986E',alignItems:'center',justifyContent:'center'},dkd_status_kicker:{color:'rgba(217,236,255,0.82)',fontSize:12,fontWeight:'900',letterSpacing:1.5},dkd_status_title:{color:'#FFFFFF',fontSize:29,fontWeight:'900',marginTop:4},dkd_status_sub:{color:'rgba(232,239,255,0.68)',fontSize:15,lineHeight:22,fontWeight:'700',marginTop:14},dkd_status_bottom:{flexDirection:'row',alignItems:'center',gap:12,marginTop:18},dkd_location_chip:{flex:1,minHeight:58,borderRadius:20,borderWidth:1,borderColor:'rgba(255,255,255,0.12)',backgroundColor:'rgba(255,255,255,0.05)',flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:16},dkd_location_text:{color:'rgba(238,244,255,0.78)',fontSize:15,fontWeight:'800'},dkd_status_button:{minHeight:58,borderRadius:20,backgroundColor:'#9BF4D1',paddingHorizontal:18,flexDirection:'row',alignItems:'center',gap:7},dkd_status_button_text:{color:'#07111C',fontSize:15,fontWeight:'900'},
  dkd_location_error:{borderRadius:18,borderWidth:1,borderColor:'rgba(255,214,107,0.25)',backgroundColor:'rgba(255,214,107,0.08)',padding:14,flexDirection:'row',alignItems:'center',gap:9},dkd_location_error_text:{color:'#FFE9A8',fontWeight:'800'},
  dkd_support_button:{borderRadius:22,overflow:'hidden'},dkd_support_fill:{minHeight:76,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12},dkd_support_text:{color:'#FFFFFF',fontSize:20,fontWeight:'900'},
  dkd_card_shell:{borderRadius:28,overflow:'hidden',borderWidth:1,borderColor:'rgba(123,230,255,0.22)'},dkd_card_fill:{minHeight:194,padding:22},dkd_card_icon_row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},dkd_icon_group:{minWidth:60,height:48,borderRadius:16,backgroundColor:'rgba(255,255,255,0.07)',alignItems:'center',justifyContent:'center'},dkd_badge:{paddingHorizontal:13,paddingVertical:8,borderRadius:999,borderWidth:1,borderColor:'rgba(255,255,255,0.12)',backgroundColor:'rgba(255,255,255,0.05)'},dkd_badge_text:{color:'#E7F6FF',fontSize:11,fontWeight:'900'},dkd_card_title:{color:'#FFFFFF',fontSize:25,fontWeight:'900',marginTop:16},dkd_card_subtitle:{color:'rgba(239,244,255,0.72)',fontSize:14,lineHeight:21,marginTop:7,maxWidth:'88%'},dkd_card_cta:{position:'absolute',right:18,bottom:18,borderRadius:18,backgroundColor:'#8CEEFF',paddingHorizontal:17,paddingVertical:11,flexDirection:'row',alignItems:'center',gap:7},dkd_card_cta_text:{color:'#092032',fontSize:15,fontWeight:'800'},
  dkd_grid:{flexDirection:'row',gap:14},dkd_grid_card:{flex:1,minHeight:180,borderRadius:25,borderWidth:1,borderColor:'rgba(255,255,255,0.12)',padding:18},dkd_grid_teal:{backgroundColor:'rgba(9,73,78,0.66)'},dkd_grid_pink:{backgroundColor:'rgba(91,20,57,0.66)'},dkd_grid_icons:{height:45,flexDirection:'row',alignItems:'center',gap:8},dkd_grid_title:{color:'#FFFFFF',fontSize:21,fontWeight:'900',marginTop:14},dkd_grid_sub:{color:'rgba(239,244,255,0.68)',fontSize:13,lineHeight:19,marginTop:8},dkd_pressed:{opacity:0.88,transform:[{scale:0.992}]},dkd_bottom_space:{height:22},
});

export default memo(MapHomeScreen);
