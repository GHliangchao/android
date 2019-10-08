package com.tuidian.app.nfctool.util;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**URI工具类
 * 
 * @author pzp@maihesoft.com
 * @since 2019-02-28
 *
 */
public final class UriUtil {
    
    public static final Map<Byte, String> URI_PREFIX_TAB;
    
    private UriUtil(){}
    
    static {
        final Map<Byte, String> tab = new HashMap<>();
        tab.put((byte) 0x00, "");
        tab.put((byte) 0x01, "http://www.");
        tab.put((byte) 0x02, "https://www.");
        tab.put((byte) 0x03, "http://");
        tab.put((byte) 0x04, "https://");
        
        URI_PREFIX_TAB = Collections.unmodifiableMap(tab);
    }

}
