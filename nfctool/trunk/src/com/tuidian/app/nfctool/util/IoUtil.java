package com.tuidian.app.nfctool.util;

/**Io工具类
 * 
 * @author pzp@maihesoft.com
 * @since 2019-02-27
 *
 */
public final class IoUtil {
    
    private IoUtil(){}
    
    public static final void close(AutoCloseable closeable){
        if(closeable != null){
            try {
                closeable.close();
            } catch (Exception e) {}
        }
    }

}
