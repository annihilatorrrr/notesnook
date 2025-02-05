/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Platform } from "react-native";
import Orientation from "react-native-orientation";
import { enabled } from "react-native-privacy-snapshot";
import { MMKV } from "../common/database/mmkv";
import { SettingStore, useSettingStore } from "../stores/use-setting-store";
import { ThemeStore } from "../stores/use-theme-store";
import { AndroidModule } from "../utils";
import { getColorScheme } from "../utils/color-scheme/utils";
import { scale, updateSize } from "../utils/size";
import { DDS } from "./device-detection";

function migrate(settings: SettingStore["settings"]) {
  if (settings.migrated) return true;

  const introCompleted = MMKV.getString("introCompleted");

  if (!introCompleted) {
    settings.migrated = true;
    set(settings);
    return;
  }

  settings.introCompleted = true;
  MMKV.removeItem("introCompleted");

  let askForRating = MMKV.getString("askForRating");
  if (askForRating) {
    if (askForRating === "completed" || askForRating === "never") {
      settings.rateApp = false;
    } else {
      askForRating = JSON.parse(askForRating);
      settings.rateApp = (
        askForRating as unknown as { timestamp: number }
      ).timestamp;
    }

    MMKV.removeItem("askForRating");
  }

  let askForBackup = MMKV.getString("askForBackup");
  if (askForBackup) {
    askForBackup = JSON.parse(askForBackup);
    settings.rateApp = (
      askForBackup as unknown as { timestamp: number }
    ).timestamp;
    MMKV.removeItem("askForBackup");
  }

  const lastBackupDate = MMKV.getString("backupDate");
  if (lastBackupDate) settings.lastBackupDate = parseInt(lastBackupDate);
  MMKV.removeItem("backupDate");

  const isUserEmailConfirmed = MMKV.getString("isUserEmailConfirmed");
  if (isUserEmailConfirmed === "yes") settings.userEmailConfirmed = true;
  if (isUserEmailConfirmed === "no") settings.userEmailConfirmed = false;

  MMKV.removeItem("isUserEmailConfirmed");

  const userHasSavedRecoveryKey = MMKV.getString("userHasSavedRecoveryKey");
  if (userHasSavedRecoveryKey) settings.recoveryKeySaved = true;
  MMKV.removeItem("userHasSavedRecoveryKey");

  const accentColor = MMKV.getString("accentColor");
  if (accentColor) settings.theme.accent = accentColor;
  MMKV.removeItem("accentColor");

  let theme = MMKV.getString("theme");
  if (theme) {
    theme = JSON.parse(theme);
    if ((theme as unknown as ThemeStore["colors"]).night)
      settings.theme.dark = true;
    MMKV.removeItem("theme");
  }
  const backupStorageDir = MMKV.getString("backupStorageDir");
  if (backupStorageDir)
    settings.backupDirectoryAndroid = JSON.parse(backupStorageDir);
  MMKV.removeItem("backupStorageDir");

  const dontShowCompleteSheet = MMKV.getString("dontShowCompleteSheet");
  if (dontShowCompleteSheet) settings.showBackupCompleteSheet = false;
  MMKV.removeItem("dontShowCompleteSheet");

  settings.migrated = true;
  set(settings);

  return true;
}

function init() {
  scale.fontScale = 1;
  const settingsJson = MMKV.getString("appSettings");
  let settings = get();
  if (!settingsJson) {
    MMKV.setString("appSettings", JSON.stringify(settings));
  } else {
    settings = {
      ...settings,
      ...JSON.parse(settingsJson)
    };
  }

  if (settings.fontScale) {
    scale.fontScale = settings.fontScale;
  }
  setTimeout(() => setPrivacyScreen(settings));
  updateSize();
  useSettingStore.getState().setSettings({ ...settings });
  migrate(settings);
  getColorScheme();
  return;
}

function setPrivacyScreen(settings: SettingStore["settings"]) {
  if (settings.privacyScreen || settings.appLockMode === "background") {
    if (Platform.OS === "android") {
      AndroidModule.setSecureMode(true);
    } else {
      enabled(true);
    }
  } else {
    if (Platform.OS === "android") {
      AndroidModule.setSecureMode(false);
    } else {
      enabled(false);
    }
  }
}

function set(next: Partial<SettingStore["settings"]>) {
  let settings = get();
  settings = {
    ...settings,
    ...next
  };

  useSettingStore.getState().setSettings(settings);
  setTimeout(() => MMKV.setString("appSettings", JSON.stringify(settings)), 1);
}

function toggle(id: keyof SettingStore["settings"]) {
  let settings = get();
  if (typeof settings[id] !== "boolean") return;
  settings = {
    ...settings
  };
  //@ts-ignore
  settings[id] = !settings[id];

  useSettingStore.getState().setSettings(settings);
  MMKV.setString("appSettings", JSON.stringify(settings));
}

function get() {
  return { ...useSettingStore.getState().settings };
}

function onFirstLaunch() {
  const introCompleted = get().introCompleted;
  if (!introCompleted) {
    set({
      rateApp: Date.now() + 86400000 * 2,
      nextBackupRequestTime: Date.now() + 86400000 * 3
    });
  }
}

function checkOrientation() {
  Orientation.getOrientation((e: Error, orientation: string) => {
    DDS.checkSmallTab(orientation);
    useSettingStore.getState().setDimensions({
      width: DDS.width as number,
      height: DDS.height as number
    });
    useSettingStore
      .getState()
      .setDeviceMode(
        DDS.isLargeTablet()
          ? "tablet"
          : DDS.isSmallTab
          ? "smallTablet"
          : "mobile"
      );
  });
}

const SettingsService = {
  init,
  set,
  get,
  toggle,
  onFirstLaunch,
  checkOrientation
};

export default SettingsService;
