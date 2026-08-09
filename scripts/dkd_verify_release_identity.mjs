import fs from 'node:fs';

const dkd_app_value = JSON.parse(fs.readFileSync('app.json', 'utf8'));
const dkd_package_value = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dkd_fail_value = (dkd_message_value) => { throw new Error(`[DraBornGo release identity] ${dkd_message_value}`); };

if (dkd_app_value?.expo?.version !== '0.0.13') dkd_fail_value('app.json expo.version must be 0.0.13');
if (Number(dkd_app_value?.expo?.android?.versionCode) !== 13) dkd_fail_value('Android versionCode must be 13');
if (dkd_package_value?.version !== '0.0.13') dkd_fail_value('package.json version must be 0.0.13');
if (dkd_app_value?.expo?.android?.package !== 'com.draborneagle.draborngo') dkd_fail_value('Android package changed unexpectedly');

console.log('DraBornGo v0.0.13 / Android versionCode 13 identity: PASS');
