import dkd_file_system_module from 'node:fs';
import dkd_path_module from 'node:path';

const dkd_project_root_path_value = process.cwd();
const dkd_defaults_file_path_value = dkd_path_module.join(
  dkd_project_root_path_value,
  'config',
  'dkd_public_env.defaults.json'
);

const dkd_required_key_name_values = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN'
];

if (!dkd_file_system_module.existsSync(dkd_defaults_file_path_value)) {
  throw new Error('DKD ERROR: config/dkd_public_env.defaults.json bulunamadı.');
}

const dkd_default_env_values = JSON.parse(
  dkd_file_system_module.readFileSync(
    dkd_defaults_file_path_value,
    'utf8'
  )
);

for (const dkd_key_name_value of dkd_required_key_name_values) {
  const dkd_key_content_value = String(
    dkd_default_env_values[dkd_key_name_value] || ''
  ).trim();

  if (!dkd_key_content_value) {
    throw new Error(
      `DKD ERROR: ${dkd_key_name_value} boş bırakılamaz.`
    );
  }

  dkd_default_env_values[dkd_key_name_value] =
    dkd_key_content_value;
}

if (
  !dkd_default_env_values.EXPO_PUBLIC_SUPABASE_URL.startsWith(
    'https://'
  )
) {
  throw new Error(
    'DKD ERROR: Supabase URL https:// ile başlamalı.'
  );
}

if (
  !dkd_default_env_values.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN.startsWith(
    'pk.'
  )
) {
  throw new Error(
    'DKD ERROR: Mapbox public token pk. ile başlamalı.'
  );
}

const dkd_env_file_content_value =
  dkd_required_key_name_values
    .map(
      (dkd_key_name_value) =>
        `${dkd_key_name_value}=${dkd_default_env_values[dkd_key_name_value]}`
    )
    .join('\n') + '\n';

const dkd_local_env_file_name_values = [
  '.env',
  '.env.local',
  '.env.production'
];

for (
  const dkd_env_file_name_value of
  dkd_local_env_file_name_values
) {
  const dkd_env_file_path_value = dkd_path_module.join(
    dkd_project_root_path_value,
    dkd_env_file_name_value
  );

  dkd_file_system_module.writeFileSync(
    dkd_env_file_path_value,
    dkd_env_file_content_value,
    'utf8'
  );

  dkd_file_system_module.chmodSync(
    dkd_env_file_path_value,
    0o600
  );
}

const dkd_generated_module_path_value =
  dkd_path_module.join(
    dkd_project_root_path_value,
    'src',
    'lib',
    'dkd_public_env.generated.js'
  );

const dkd_generated_module_content_value =
  `export const dkd_generated_public_env_value = ${JSON.stringify(
    dkd_default_env_values,
    null,
    2
  )};\n`;

dkd_file_system_module.writeFileSync(
  dkd_generated_module_path_value,
  dkd_generated_module_content_value,
  'utf8'
);

console.log(
  'DKD public env ayarları .env dosyalarına ve uygulama içine geri yüklendi.'
);
