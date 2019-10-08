package com.tuidian.tech.nfctool;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;

import android.util.Log;

import com.tuidian.app.nfctool.util.IoUtil;

/**可写的NFC码文件。
 * 
 * @author pzp@maihesoft.com
 * @since 2019-02-28
 *
 */
public class WritableNfcodeFile implements AutoCloseable {
    static final String TAG = "wNfcodeFile";
    
    protected RandomAccessFile file;
    protected Nfcode cur;
    
    protected int pageNo;
    protected int pageSize;
    
    // Status file pointer since 2019-03-07 pzp
    private long statusfp = -1L;
    
    public WritableNfcodeFile(){
        
    }
    
    public WritableNfcodeFile(File filePath, int pageSize)throws IOException {
        boolean failed = true;
        try{
            this.file = new RandomAccessFile(filePath, "rwd");
            this.pageSize = pageSize;
            failed = false;
        }finally{
            if(failed){
                close();
            }
        }
    }
    
    public WritableNfcodeFile(String filePath, int pageSize) throws IOException {
        this(new File(filePath), pageSize);
    }
    
    public Nfcode nextTo(Nfcode code) throws IOException {
        // line: id,sn,code,version,status:1B,sign
        // + sign field since 2019-03-07 pzp
        boolean failed = true;
        try {
            final StringBuilder sb = new StringBuilder();
            
            // init internal state
            Nfcode tmp = new Nfcode();
            int i = 0, li = getLinenum() + 1;
            this.cur = null;
            this.statusfp = -1L;
            
            int c = this.file.read();
            for(;;){
                switch(c){
                case -1:
                    if(sb.length() == 0){
                        failed = false;
                        return null;
                    }
                    // fall-through
                case ',':
                case '\n':
                    final String val = sb.toString();
                    sb.setLength(0);
                    if(val.length() == 0){
                        throw new IOException(String.format("第%s行格式错误", li));
                    }
                    ++i;
                    switch(i){
                    case 1:
                        tmp.setId(val);
                        break;
                    case 2:
                        tmp.setSn(val);
                        break;
                    case 3:
                        tmp.setCode(val);
                        break;
                    case 4:
                        final int ver;
                        try{
                            ver = Integer.parseInt(val);
                        }catch(final Exception e){
                            Log.w(TAG, e);
                            throw new IOException(String.format("第%s行版本格式错误", li));
                        }
                        tmp.setVersion(ver);
                        break;
                    case 5:
                        final int status;
                        try{
                            status = Integer.parseInt(val);
                            if(Nfcode.checkStatus(status)){
                                throw new IOException(String.format("第%s行状态值错误", li));
                            }
                        }catch(final NumberFormatException e){
                            Log.w(TAG, e);
                            throw new IOException(String.format("第%s行状态格式错误", li));
                        }
                        tmp.setStatus(status);
                        this.statusfp = this.file.getFilePointer() - 2L/*S,*/;
                        break;
                    case 6:
                        // read & check csv code sign since 2019-03-07 pzp
                        tmp.setSign(val);
                        if(tmp.checkCsvSign()){
                            throw new IOException(String.format("第%s行签名值错误", li));
                        }
                        
                        if(c != '\n' && c != -1){
                            throw new IOException(String.format("第%s行内容太长了", li));
                        }
                        tmp.setLinenum(li);
                        this.pageNo = li / this.pageSize;
                        if(this.pageNo * this.pageSize < li){
                            this.pageNo++;
                        }
                        
                        this.cur = tmp;
                        if(code == null){
                            failed = false;
                            return this.cur;
                        }
                        if(code.getLinenum() == li 
                                && code.getId().equals(tmp.getId()) 
                                    && code.getCode().equals(tmp.getCode())){
                            failed = false;
                            return this.cur;
                        }
                        // skip-to-next
                        tmp = new Nfcode();
                        li  = getLinenum() + 1;
                        i   = 0;
                        break;
                    default:
                        break;
                    }
                    break;
                case '\r':
                    break;
                default:
                    sb.append((char)c);
                    break;
                }
                c = this.file.read();
            }
        }finally{
            if(failed){
                close();
            }
        }
    }
    
    public void updateStatus(int status) throws IOException {
        if(Nfcode.checkStatus(status)){
            throw new IllegalArgumentException("status: " + status);
        }
        if(this.cur == null || this.statusfp == -1L){
            throw new IllegalStateException("Doesn't read next code");
        }
        
        final long p = this.file.getFilePointer();
        // do-update-status
        this.file.seek(this.statusfp);
        this.file.write('0' + status);
        // reset fp
        this.file.seek(p);
    }
    
    public boolean isOpen() {
        return this.file.getChannel().isOpen();
    }
    
    int getLinenum(){
        return (this.cur == null? 0: this.cur.getLinenum());
    }
    
    public Nfcode next() throws IOException {
        return nextTo(null);
    }
    
    public int getPageNo() {
        return pageNo;
    }

    public void setPageNo(int pageNo) {
        this.pageNo = pageNo;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }
    
    @Override
    public void close(){
        IoUtil.close(this.file);
    }
    
    @Override
    protected void finalize(){
        close();
    }

}
