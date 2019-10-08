package com.tuidian.tech.nfctool;

import java.util.ArrayList;
import java.util.List;

/**NFC码页。
 * 
 * @author pzp@maihesoft.com
 * @since 2019-02-27
 *
 */
public class NfcodePage {
    static final String TAG = "nfcodePage";
    
    public static final int PAGE_SIZE_DEFAULT = 50;
    
    private String fileName;
    
    private int pageNo = 1;
    private int pageSize = PAGE_SIZE_DEFAULT;
    private int pageTotal;
    private List<Nfcode> codes;
    
    public NfcodePage(){
        this.codes = new ArrayList<>();
    }
    
    public NfcodePage(String fileName, int pageNo){
        this(fileName, pageNo, PAGE_SIZE_DEFAULT);
    }
    
    public NfcodePage(String fileName, int pageNo, int pageSize){
        this.fileName = fileName;
        this.pageNo   = pageNo;
        this.pageSize = pageSize;
        this.codes = new ArrayList<>(this.pageSize);
    }
    
    public List<Nfcode> getCodes() {
        return codes;
    }
    
    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
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

    public int getPageTotal() {
        return pageTotal;
    }

    public void setPageTotal(int pageTotal) {
        this.pageTotal = pageTotal;
    }

    public NfcodePage addCode(Nfcode nfcode) {
        this.codes.add(nfcode);
        return this;
    }

}
