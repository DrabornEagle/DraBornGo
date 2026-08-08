from pathlib import Path
import re, json
ROOT=Path('.')

def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s):
    q=ROOT/p; q.parent.mkdir(parents=True,exist_ok=True); q.write_text(s,encoding='utf-8')
def remove(p):
    q=ROOT/p
    if q.exists(): q.unlink()

# Operational geo helper is required by location tracking and is not part of the
# retired map/chest game system.
write('src/utils/geo.js', '''const DKD_EARTH_RADIUS_M = 6371000;\nexport function haversineMeters(dkd_lat1_value, dkd_lng1_value, dkd_lat2_value, dkd_lng2_value) {\n  const dkd_to_rad_value = (dkd_degree_value) => (Number(dkd_degree_value) * Math.PI) / 180;\n  const dkd_lat1_rad_value = dkd_to_rad_value(dkd_lat1_value);\n  const dkd_lat2_rad_value = dkd_to_rad_value(dkd_lat2_value);\n  const dkd_delta_lat_value = dkd_to_rad_value(Number(dkd_lat2_value) - Number(dkd_lat1_value));\n  const dkd_delta_lng_value = dkd_to_rad_value(Number(dkd_lng2_value) - Number(dkd_lng1_value));\n  const dkd_a_value = Math.sin(dkd_delta_lat_value / 2) ** 2 + Math.cos(dkd_lat1_rad_value) * Math.cos(dkd_lat2_rad_value) * Math.sin(dkd_delta_lng_value / 2) ** 2;\n  return DKD_EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(dkd_a_value), Math.sqrt(1 - dkd_a_value));\n}\n''')

# Retired drop/history/admin-drop source.
for p in ['src/hooks/useHistoryData.js','src/hooks/useDropState.js','src/features/admin/AdminDropsModal.js']:
    remove(p)

# Remove the last courier XP panel that was nested in the operational profile card.
p='src/features/courier/CourierBoardModal.js'; t=read(p)
t=re.sub(r'\n\s*<View style=\{styles\.dkdCourierProfileXpPanel\}>.*?</View>', '', t, flags=re.S)
for prefix in ['dkdCourierProfileXpPanel','heroXpMeta','heroXpRewardLine']:
    t=re.sub(r'\n\s*'+prefix+r':\s*\{[^\n]*\},?', '', t)
write(p,t)

# Historical migration whose user-facing message still described wallet payment.
remove('supabase/migrations/20260426_dkd_urgent_courier_event_notifications.sql')

# Unused native dependencies that can introduce unnecessary Google Play SDK /
# permission surface. Camera capture is handled through expo-image-picker.
pkg_path=ROOT/'package.json'; pkg=json.loads(pkg_path.read_text(encoding='utf-8'))
deps=pkg.get('dependencies',{})
deps.pop('expo-camera',None)
deps.pop('react-native-google-mobile-ads',None)
pkg['dependencies']=deps
pkg_path.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# app.json no longer needs an expo-camera plugin entry.
app_path=ROOT/'app.json'; app=json.loads(app_path.read_text(encoding='utf-8'))
plugins=app.get('expo',{}).get('plugins',[])
clean=[]
for entry in plugins:
    name=entry[0] if isinstance(entry,list) and entry else entry
    if name=='expo-camera': continue
    clean.append(entry)
app['expo']['plugins']=clean
app_path.write_text(json.dumps(app,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
