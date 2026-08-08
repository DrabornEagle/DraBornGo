from pathlib import Path
import re

ROOT=Path('.')

def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s):
    q=ROOT/p
    q.parent.mkdir(parents=True,exist_ok=True)
    q.write_text(s,encoding='utf-8')
def remove(p):
    q=ROOT/p
    if q.exists(): q.unlink()

# Active source cleanup ---------------------------------------------------------
# Courier board: remove the remaining gamification and wallet bookkeeping while
# leaving courier application, assignment, pickup and delivery flows intact.
p='src/features/courier/CourierBoardModal.js'; t=read(p)
t=re.sub(r'\nfunction courierXpGoalForLevel\(.*?\nfunction courierRegionLabel\(', '\nfunction courierRegionLabel(', t, flags=re.S)
t=re.sub(r'\nfunction CourierLevelUpModal\(.*?\nfunction DkdCargoPickupProofModal\(', '\nfunction DkdCargoPickupProofModal(', t, flags=re.S)
t=re.sub(r'\n  const courierProgress = useMemo\(.*?\n  const dkd_active_task_value', '\n  const dkd_active_task_value', t, flags=re.S)
# Replace completion callback with operational-only profile updates.
start=t.find('  const handleComplete = useCallback(async (task) => {')
end=t.find('\n  const dkd_admin_delete_courier_job_value', start)
if start!=-1 and end!=-1:
    block='''  const handleComplete = useCallback(async (task) => {\n    setSavingId(String(task?.id || ''));\n    try {\n      const { data, error } = await completeCourierJob(task?.id);\n      if (error) throw error;\n      const row = Array.isArray(data) ? data[0] : data;\n      const dkd_next_courier_score_value = Number(row?.courier_score ?? (Number(profile?.courier_score || 0) + Number(task?.reward_score || 0)));\n      const dkd_next_completed_jobs_value = Number(row?.courier_completed_jobs ?? (Number(profile?.courier_completed_jobs || 0) + 1));\n      if (setProfile) {\n        setProfile((dkd_previous_profile_value) => (\n          dkd_previous_profile_value\n            ? {\n                ...dkd_previous_profile_value,\n                courier_status: dkd_previous_profile_value.courier_status || 'approved',\n                courier_score: dkd_next_courier_score_value,\n                courier_completed_jobs: dkd_next_completed_jobs_value,\n                courier_active_days: Number(row?.courier_active_days ?? dkd_previous_profile_value?.courier_active_days ?? 0),\n                courier_last_completed_at: row?.courier_last_completed_at || new Date().toISOString(),\n                courier_fastest_eta_min: row?.courier_fastest_eta_min == null\n                  ? (dkd_previous_profile_value?.courier_fastest_eta_min ?? null)\n                  : Number(row?.courier_fastest_eta_min),\n              }\n            : dkd_previous_profile_value\n        ));\n      }\n      const dkd_delivery_unlock_result_value = await dkd_unlock_courier_delivery_state_value(task?.id);\n      if (dkd_delivery_unlock_result_value?.error) throw dkd_delivery_unlock_result_value.error;\n      setDkdCourierOnlineFlagValue(true);\n      setDkdAutoAssignedJobIdValue(null);\n      setProfile?.((dkd_previous_profile_value) => (dkd_previous_profile_value ? { ...dkd_previous_profile_value, dkd_courier_online: true, dkd_courier_auto_assigned_job_id: null } : dkd_previous_profile_value));\n      setTasks((dkd_previous_rows_value) => {\n        const dkd_next_rows_value = (Array.isArray(dkd_previous_rows_value) ? dkd_previous_rows_value : []).filter((dkd_row_value) => String(dkd_row_value?.id || '') !== String(task?.id || ''));\n        return dkd_keep_previous_task_rows_if_same_value(dkd_previous_rows_value, dkd_next_rows_value);\n      });\n      setTimeout(() => { loadJobs({ dkd_force_refresh: true, dkd_cache_ttl_ms: 0 }); }, 500);\n      Alert.alert('Kurye', 'Teslimat tamamlandı. Çevrimiçi mod açık kaldı, yeni sipariş aranıyor.');\n    } catch (dkd_error_value) {\n      Alert.alert('Kurye', dkd_error_value?.message || 'Teslimat kaydedilemedi.');\n    } finally {\n      setSavingId(null);\n    }\n  }, [loadJobs, profile, setProfile]);\n'''
    t=t[:start]+block+t[end:]
# Remove XP/level hero copy and reward modal render if still present.
t=re.sub(r'\n\s*<View style=\{styles\.heroXp[^>]*>.*?</View>', '', t, flags=re.S)
t=re.sub(r'\n\s*<CourierLevelUpModal\b.*?/>', '', t, flags=re.S)
t=re.sub(r'^\s*const \[rewardModal[^\n]*\n','',t,flags=re.M)
t=re.sub(r'^\s*setRewardModal\([^\n]*\);\n','',t,flags=re.M)
# Remove style declarations tied only to removed gamification modal/hero.
for prefix in ['reward','heroXp']:
    t=re.sub(r'\n\s*'+prefix+r'[A-Za-z0-9_]*:\s*\{[^\n]*\},?', '', t)
write(p,t)

# Urgent courier: wallet is not part of v0.0.7.
p='src/features/courier/dkd_urgent_courier_panel.js'; t=read(p)
t=re.sub(r'\n\s*const dkd_wallet_value = useMemo\(.*?\n\s*\}, \[[^\]]*\]\);', '', t, flags=re.S)
t=re.sub(r'\n\s*<DkdMetricTile[^\n]*dkd_label_value="Cüzdan"[^\n]*/>', '', t)
write(p,t)

# Service-network data: remove payment-state aliases; prices/quotes remain operational.
p='src/services/dkd_service_network_service.js'; t=read(p)
t=t.replace(" || dkd_row_value?.dkd_payment_status",'')
t=re.sub(r'^\s*dkd_payment_status:\s*[^\n]*\n','',t,flags=re.M)
t=re.sub(r'^\s*dkd_use_wallet_payment_value:\s*[^\n]*\n','',t,flags=re.M)
write(p,t)

p='src/features/serviceNetwork/dkd_service_network_modal.js'; t=read(p)
t=re.sub(r'^\s*payment_status:\s*[^\n]*\n','',t,flags=re.M)
t=re.sub(r'^\s*dkd_payment_status:\s*[^\n]*\n','',t,flags=re.M)
write(p,t)

p='src/services/dkd_cargo_service.js'; t=read(p)
t=t.replace(', payment_status, paid_at','').replace('payment_status, paid_at, ','')
t=re.sub(r'^\s*payment_status:\s*[^\n]*\n','',t,flags=re.M)
t=re.sub(r'^\s*paid_at:\s*[^\n]*\n','',t,flags=re.M)
write(p,t)

# Broadcast category no longer advertises deleted collection system.
p='src/features/admin/AdminBroadcastModal.js'; t=read(p)
t=re.sub(r"\n\s*\{ key: 'collection', label: 'Koleksiyon' \},",'',t)
write(p,t)

remove('src/features/courier/COURIER_PROFILE_INTEGRATION_TR.md')

# Login policy versions + dedicated community policy page.
p='src/features/auth/AuthScreen.js'; t=read(p)
t=t.replace("const dkd_terms_version_value = '2026-05-19-v0.0.3';","const dkd_terms_version_value = '2026-08-08-v0.0.7';")
t=t.replace("const dkd_privacy_version_value = '2026-05-19-v0.0.3';","const dkd_privacy_version_value = '2026-08-08-v0.0.7';")
t=t.replace("const dkd_community_policy_version_value = '2026-05-19-v0.0.3';","const dkd_community_policy_version_value = '2026-08-08-v0.0.7';")
if 'dkd_community_public_url_value' not in t:
    t=t.replace("const dkd_privacy_public_url_value = 'https://www.draborneagle.com/draborngo/privacy/';", "const dkd_privacy_public_url_value = 'https://www.draborneagle.com/draborngo/privacy/';\nconst dkd_community_public_url_value = 'https://www.draborneagle.com/draborngo/community/';")
t=t.replace("dkd_open_policy_url(dkd_terms_public_url_value)","dkd_open_policy_url(dkd_terms_public_url_value)",1)
# Replace only explicit community-policy link if it currently points to terms.
t=t.replace("onPress={() => dkd_open_policy_url(dkd_terms_public_url_value)}><Text style={dkd_styles.dkd_terms_link}>Topluluk Kuralları</Text>","onPress={() => dkd_open_policy_url(dkd_community_public_url_value)}><Text style={dkd_styles.dkd_terms_link}>Topluluk Kuralları</Text>")
write(p,t)

# Permission copy: removed payment/receipt scope.
p='app.json'; t=read(p)
t=t.replace('paket, ürün, profil veya dekont görselini','paket, ürün, profil veya başvuru görselini')
t=t.replace('paket, ürün, profil veya dekont fotoğrafı','paket, ürün, profil veya başvuru fotoğrafı')
write(p,t)
p='app.config.js'; t=read(p).replace('versionCode: dkd_source_android_config_value.versionCode || 6','versionCode: dkd_source_android_config_value.versionCode || 7').replace('versionCode: dkd_android_config_value.versionCode || 6','versionCode: dkd_android_config_value.versionCode || 7'); write(p,t)

# Google Play web pages ---------------------------------------------------------
terms='''<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DraBornGo Kullanım Şartları</title><style>body{margin:0;background:#07111f;color:#f8fafc;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.65}main{max-width:860px;margin:auto;padding:32px 18px 60px}a{color:#67e8f9}.card{background:#0f1f33;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:18px;margin:16px 0}</style></head><body><main><h1>DraBornGo Kullanım Şartları</h1><p>Son güncelleme: 8 Ağustos 2026 • v0.0.7</p><div class="card">DraBornGo; kurye, teslimat, işletme, hizmet ağı, destek ve kullanıcı iletişimi özellikleri sunar. Uygulamayı kullanırken doğru bilgi vermeyi ve yürürlükteki kurallara uymayı kabul edersin.</div><h2>Kullanıcı içerikleri ve iletişim</h2><p>Tehdit, taciz, nefret, cinsel sömürü, yasa dışı içerik, dolandırıcılık, spam, kişisel veri ifşası veya başkalarının haklarını ihlal eden içerik yasaktır. Kullanıcılar uygunsuz içerik veya hesabı raporlayabilir ve gerektiğinde diğer kullanıcıları engelleyebilir. DraBornGo içerikleri inceleyebilir, kaldırabilir; hesapları kısıtlayabilir veya askıya alabilir.</p><h2>Kurye ve hizmet işlemleri</h2><p>Kullanıcılar teslimat ve hizmet taleplerinde doğru adres, iletişim ve operasyon bilgisi vermelidir. Kurye ve işletme onayları güvenlik ve operasyon kurallarına tabidir.</p><h2>Hesap güvenliği</h2><p>Hesap erişimini ve şifreni korumak kullanıcının sorumluluğundadır. Kötüye kullanım veya güvenlik riski tespit edildiğinde hesap erişimi sınırlandırılabilir.</p><h2>Gizlilik ve silme</h2><p><a href="../privacy/">Gizlilik Politikası</a> ve <a href="../account-deletion/">Hesap Silme</a> sayfaları bu şartların parçasıdır.</p><h2>İletişim</h2><p><a href="mailto:support@draborneagle.com">support@draborneagle.com</a></p></main></body></html>'''
write('web/draborngo/terms/index.html',terms+'\n')
community='''<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DraBornGo Topluluk Kuralları</title><style>body{margin:0;background:#07111f;color:#f8fafc;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.65}main{max-width:860px;margin:auto;padding:32px 18px 60px}a{color:#67e8f9}.card{background:#0f1f33;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:18px;margin:16px 0}</style></head><body><main><h1>DraBornGo Topluluk Kuralları</h1><p>Son güncelleme: 8 Ağustos 2026 • v0.0.7</p><div class="card"><strong>Güvenli iletişim:</strong> Saygılı ol; taciz, tehdit, nefret, cinsel sömürü, dolandırıcılık, spam, yasa dışı içerik ve kişisel veri ifşası yasaktır.</div><h2>Raporlama ve engelleme</h2><p>Uygunsuz kullanıcı veya içerikler uygulama içindeki raporlama araçlarıyla moderasyona gönderilebilir. Bire bir iletişimde kullanıcı engelleme araçları kullanılabilir.</p><h2>Moderasyon</h2><p>DraBornGo bildirilen içerikleri ve hesapları inceleyebilir; içerik kaldırma, erişim kısıtlama veya hesap askıya alma işlemleri uygulayabilir.</p><h2>Destek</h2><p><a href="mailto:support@draborneagle.com">support@draborneagle.com</a></p></main></body></html>'''
write('web/draborngo/community/index.html',community+'\n')

# Remove historical source files that still embed the retired systems. Live
# production schema has already been migrated, so these are legacy source only.
banned=re.compile(r'(dkd_puan|boss_tickets|energy_max|daily_reward_state|task_state|weekly_task_state|wallet_tl|courier_wallet_tl|merchant_wallet_tl|courier_total_earned_tl|courier_withdrawn_tl|rank_key|\bshards\b|Günlük Ödül|Harita=Sandıklar|Koleksiyon kartı|Özel Kart)',re.I)
for base in [ROOT/'supabase/migrations',ROOT/'supabase/sql']:
    if not base.exists(): continue
    for q in list(base.rglob('*.sql')):
        if q.name=='20260808_dkd_v0_0_7_remove_legacy_game_economy_sms.sql': continue
        try: text=q.read_text(encoding='utf-8')
        except Exception: continue
        if banned.search(text): q.unlink()
