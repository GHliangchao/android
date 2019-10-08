package com.tuidian.tech.nfctool;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;

import org.json.JSONObject;

import android.util.Log;

import com.tuidian.app.nfctool.util.IoUtil;

/**Tool配置文件
 * 
 * @author pzp@maihesoft.com
 * @since 2019-02-28
 *
 */
public class ConfigFile {
    static final String TAG = "configFile";
    
    public static final String HOME_DIR  = "zmaNFCTool";
    public static final String CONF_FILE = "conf.json";
    static final String ENCODING = "UTF-8";
    
    private int writeResult;
    private String writeFileName;
    private int writePageNo;
    
    public ConfigFile(){
        
    }
    
    public int getWriteResult() {
        return writeResult;
    }

    public void setWriteResult(int writeResult) {
        this.writeResult = writeResult;
    }
    
    public String getWriteFileName() {
        return writeFileName;
    }
    
    public void setWriteFileName(String writeFileName) {
        this.writeFileName = writeFileName;
    }
    
    public int getWritePageNo() {
        return writePageNo;
    }
    
    public void setWritePageNo(int writePageNo) {
        this.writePageNo = writePageNo;
    }
    
    public static ConfigFile readConfig(File fileDir){
        final File file = new File(fileDir, CONF_FILE);
        if(file.exists() && file.isFile()){
            InputStream in = null;
            BufferedReader reader = null; 
            try{
                in = new FileInputStream(file);
                reader = new BufferedReader(new InputStreamReader(in, ENCODING));
                final StringBuilder sb = new StringBuilder();
                for(;;){
                    final String line = reader.readLine();
                    if(line == null){
                        break;
                    }
                    sb.append(line);
                }
                
                final JSONObject json = new JSONObject(sb.toString());
                final JSONObject writeState = json.optJSONObject("writeState");
                if(writeState == null){
                    return null;
                }
                
                final ConfigFile config = new ConfigFile();
                config.setWriteResult(writeState.getInt("result"));
                config.setWriteFileName(writeState.optString("fileName"));
                config.setWritePageNo(writeState.optInt("pageNo"));
                return config;
            }catch(final Exception e){
                Log.w(TAG, e);
                return null;
            }finally{
                IoUtil.close(reader);
                IoUtil.close(in);
            }
        }
        return null;
    }
    
    public static boolean writeConfig(File fileDir, ConfigFile config){
        try{
            final JSONObject json = new JSONObject();
            
            final JSONObject writeState = new JSONObject();
            writeState.put("result", config.getWriteResult())
            .put("fileName", config.getWriteFileName())
            .put("pageNo", config.getWritePageNo());
            
            json.put("writeState", writeState);
            
            OutputStream out = null;
            BufferedWriter writer = null;
            try{
                out = new FileOutputStream(new File(fileDir, CONF_FILE));
                writer = new BufferedWriter(new OutputStreamWriter(out, ENCODING));
                writer.write(json.toString());
                writer.flush();
            }finally{
                IoUtil.close(writer);
                IoUtil.close(out);
            }
            return true;
        }catch(final Exception e){
            Log.w(TAG, e);
            return false;
        }
    }
    
    public static void removeConfig(File fileDir) {
        new File(fileDir, CONF_FILE).delete();
    }
    
}
