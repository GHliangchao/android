package com.tuidian.tech.zma.lock.util;

import com.tuidian.tech.zma.lock.Consts;

/**
 * A debug logger.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月2日
 *
 */
public final class Logger {
	
	private Logger(){
		// noop
	}
	
	public final static void debug(final String tag, final Object ... args){
		if(Consts.DEBUG){
			final StringBuilder sbuf = new StringBuilder();
			for(int i = 0, size = args.length; i < size; ++i){
				sbuf.append(args[i]);
			}
			log(tag, sbuf.toString());
		}
	}
	
	public final static void debugf(final String tag, final String fmt, final Object ... args){
		if(Consts.DEBUG){
			final int argc = args.length;
			if(argc == 0){
				log(tag, fmt);
				return;
			}
			log(tag, String.format(fmt, args));
		}
	}
	
	final static void log(final String tag, final String s){
		//Log.d(tag, s);
		System.out.println(String.format("[%s] %s", tag, s));
	}

}
