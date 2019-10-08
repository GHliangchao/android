package com.tuidian.app.nfctool.util;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**Security utils.
 * 
 * @author pzp@maihesoft.com
 * @since 2019-03-07
 *
 */
public final class SecUtil {
    
    static final ThreadLocal<MessageDigest> MD5 = new ThreadLocal<MessageDigest>(){
        @Override 
        protected MessageDigest initialValue() {
            try {
                return MessageDigest.getInstance("MD5");
            } catch (final NoSuchAlgorithmException e) {
                throw new RuntimeException(e);
            }
        }
    };
    
    private SecUtil(){
        
    }
    
    public static String md5(String s){
        return md5(s, "UTF-8");
    }
    
    public static String md5(String s, String encoding){
        final MessageDigest md5 = MD5.get();
        try {
            byte[] buf = s.getBytes(encoding);
            buf = md5.digest(buf);
            return ByteUtil.dumphex(buf);
        } catch (final UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
    }

}
