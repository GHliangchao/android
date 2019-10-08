package com.tuidian.tech.nfctool;

import com.tuidian.app.nfctool.util.SecUtil;

/**NFC码。
 * 
 * @author pzp@maihesoft.com
 * @since 2019-02-27
 *
 */
public class Nfcode {
    static final String BASE_URI  = "http://www.tuidianmg.com/emall/public!authNFC.htm";
    static final boolean READONLY = true;
    
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
    
    private String sign;

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
    
    public String getSign() {
        return sign;
    }

    public void setSign(String sign) {
        this.sign = sign;
    }
    
    public String getUri(){
        return String.format("%s?s=%s&c=%s&v=%s&d=%s",
                BASE_URI, this.sn, this.code, this.version, this.genNfcSign());
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
    
    public boolean checkCsvSign(){
        final String CSV_KEY = "~$!zhenmaexportcsvkeymg20190307!@$";
        final String s = 
                "code="+code
                + "&codeSn="+sn
                + "&id="+id
                + "&key="+CSV_KEY
                + "&version="+version;
        return !sign.equalsIgnoreCase(SecUtil.md5(s));
    }
    
    public String genNfcSign(){
        final String NFC_KEY = "~$!mgimportcsvkeyzhenma20190307!@$";
        final String s = 
                "code=" + code 
                + "&codeSn=" + sn 
                + "&key=" + NFC_KEY
                + "&version=" + version;
        return SecUtil.md5(s);
    }
    
}
