package com.supersami.foregroundservice;

interface PluginResult {
    int getPid();
    void result(String requestID, String result);
}
