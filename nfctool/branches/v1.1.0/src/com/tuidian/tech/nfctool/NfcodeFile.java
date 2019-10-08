package com.tuidian.tech.nfctool;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import com.tuidian.app.nfctool.util.IoUtil;

import android.os.Environment;
import android.util.Log;

/**NFC码文件。
 * 
 * @author pzp@maihesoft.com
 * @since 2019-02-26
 *
 */
public class NfcodeFile {
    static final String TAG = "nfcodeFile";
    
    private File fileDir;
    private String fileName;
    
    public NfcodeFile(){
        
    }
    
    public NfcodeFile(File fileDir, String fileName){
        this.fileDir  = fileDir;
        this.fileName = fileName;
    }
    
    public NfcodePage getPage(int pageNo, int pageSize) throws IOException {
        final File file = new File(this.fileDir, this.fileName);
        final List<Nfcode> codes = parseFile(file);
        
        final NfcodePage page = new NfcodePage(this.fileName, pageNo, pageSize);
        int pageTotal = codes.size() / pageSize;
        if(pageTotal * pageSize < codes.size()){
            pageTotal++;
        }
        page.setPageTotal(pageTotal);
        int offset = (pageNo-1) * pageSize;
        final int end = Math.min(codes.size(), offset + page.getPageSize());
        for(; offset < end; ){
            page.addCode(codes.get(offset++));
        }
        return page;
    }
    
    public File getFileDir() {
        return fileDir;
    }

    public void setFileDir(File fileDir) {
        this.fileDir = fileDir;
    }
    
    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public static List<Nfcode> parseFile(File file) throws IOException {
        InputStream in = null;
        BufferedReader reader = null;
        try{
            in = new FileInputStream(file);
            reader = new BufferedReader(new InputStreamReader(in, ConfigFile.ENCODING));
            
            final List<Nfcode> codes = new ArrayList<>();
            String line = reader.readLine();
            int li = 0;
            for(; line != null; ){
                final Nfcode code = parseCode(++li, line);
                codes.add(code);
                line = reader.readLine();
            }
            
            return codes;
        }finally{
            IoUtil.close(reader);
            IoUtil.close(in);
        }
    }
    
    private static Nfcode parseCode(final int li, String line) throws IOException {
        // line: id,sn,code,version,status,sign
        // eg. 90045,890000000001,1db62514e922e402,1,0,2df62514e922e4022df62514e922e402
        final String[] fields = line.split(",");
        if(fields.length != 6){
            throw new IOException(String.format("第%s行值的个数不等于6", li));
        }
        final int version;
        try{
            version = Integer.parseInt(fields[3]);
        }catch(final Exception e){
            throw new IOException(String.format("第%s行版本值格式错误", li));
        }
        final int status;
        try{
            status = Integer.parseInt(fields[4]);
        }catch(final Exception e){
            throw new IOException(String.format("第%s行状态值格式错误", li));
        }
        
        // Add code sign since 2019-03-07 pzp
        final String sign = fields[5];
        
        final Nfcode code = new Nfcode();
        code.setId(fields[0]);
        code.setSn(fields[1]);
        code.setCode(fields[2]);
        code.setVersion(version);
        code.setStatus(status);
        code.setLinenum(li);
        code.setSign(sign);
        
        if(code.checkCsvSign()){
            throw new IOException(String.format("第%s行签名值错误", li));
        }
        
        return code;
    }

    public static File initDir(){
        final File storageDir = Environment.getExternalStorageDirectory();
        if(storageDir == null){
            Log.w(TAG, "External storage dir not exists");
            return null;
        }
        final File fileDir = new File(storageDir, ConfigFile.HOME_DIR);
        if((fileDir.exists() && fileDir.isDirectory()) || fileDir.mkdir()){
            if(Log.isLoggable(TAG, Log.DEBUG)){
                Log.d(TAG, "The file dir " + fileDir);
            }
            return fileDir;
        }
        Log.w(TAG, "Can't make the dir " + ConfigFile.HOME_DIR);
        return null;
    }
    
    public static File[] listFiles(final File fileDir){
        return fileDir.listFiles(new FilenameFilter(){
            @Override
            public boolean accept(File dir, String name) {
                final File file = new File(dir, name);
                return (file.isFile() && name.toLowerCase(Locale.CHINA).endsWith(".csv"));
            }
        });
    }

}
