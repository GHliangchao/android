package com.tuidian.tech.nfctool;

/**NFC码。
 * 
 * @author pzp@maihesoft.com
 * @since 2019-02-27
 *
 */
public class Nfcode {
    static final String BASE_URI = "http://www.tuidianmg.com/emall/public!goodsCodeNFCCheck.htm";
    
    /** NFC码状态 - 初始 */
    public static final int S_INIT   = 0;
    /** NFC码状态 - 通过 */
    public static final int S_PASS   = 1;
    /** NFC码状态 - 作废 */
    public static final int S_CANCEL = 2;
    
    private String id;
    private String sn;
    private String code;
    private int version;
    private int status;
    // line number
    private int linenum;
    
    public Nfcode(){
        
    }
    
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSn() {
        return sn;
    }

    public void setSn(String sn) {
        this.sn = sn;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public int getVersion() {
        return version;
    }

    public void setVersion(int version) {
        this.version = version;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }
    
    public int getLinenum() {
        return linenum;
    }

    public void setLinenum(int linenum) {
        this.linenum = linenum;
    }
    
    public String getUri(){
        return String.format("%s?s=%s&c=%s&v=%s",
                BASE_URI, this.sn, this.code, this.version);
    }
    
    public boolean uriEquals(String uri){
        return (getUri().equals(uri));
    }
    
    public String getStatusText() {
        switch(status){
        case S_INIT:
            return "初始";
        case S_PASS:
            return "通过";
        case S_CANCEL:
            return "作废";
        default:
            return "未知";
        }
    }
    
    public static boolean checkStatus(final int status) {
        switch(status){
        case S_INIT:
        case S_PASS:
        case S_CANCEL:
            return false;
        default:
            return true;
        }
    }

}
