package com.emurgo;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Collections;
import java.util.List;

import com.oblador.keychain.KeychainModule;

@SuppressWarnings("unused")
public class ColdKeychainPackage implements ReactPackage {

  public ColdKeychainPackage() {

  }

  @Override
  @NonNull
  public List<NativeModule> createNativeModules(@NonNull final ReactApplicationContext reactContext) {
    return Collections.singletonList(new KeychainModule(reactContext));
  }

  @NonNull
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Collections.emptyList();
  }

  @Override
  @NonNull
  public List<ViewManager> createViewManagers(@NonNull final ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}