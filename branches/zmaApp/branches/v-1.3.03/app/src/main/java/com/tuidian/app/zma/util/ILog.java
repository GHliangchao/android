package com.tuidian.app.zma.util;

import java.io.PrintStream;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Log System.out/err-based.
 * 
 * @author pzp@maihesoft.com
 * @since 2016�?�?0�?
 *
 */
public final class ILog {
	final static String FORMAT = "%s[%s][%s] %s";
	final static String TMSFMT = "HH:mm:ss.SSS";
	
	public final static int DEBUG = 1;
	public final static int INFO  = 2;
	public final static int WARN  = 3;
	public final static int ERROR = 4;
	
	private static int LEVEL = DEBUG;
	
	public final static boolean debugEnabled(){
		return (DEBUG == LEVEL);
	}
	
	public final static boolean infoEnabled(){
		return (INFO == LEVEL);
	}
	
	public final static boolean warnEnabled(){
		return (WARN == LEVEL);
	}
	
	public final static boolean errorEnabled(){
		return (ERROR == LEVEL);
	}
	
	public final static void d(final String tag, final String message){
		d(tag, message, null);
	}
	
	public final static void i(final String tag, final String message){
		i(tag, message, null);
	}
	
	public final static void w(final String tag, final String message){
		w(tag, message, null);
	}
	
	public final static void e(final String tag, final String message){
		e(tag, message, null);
	}
	
	public final static void d(final String tag, final String message, final Throwable cause){
		LOG(DEBUG, tag, message, cause); 
	}
	
	public final static void i(final String tag, final String message, final Throwable cause){
		LOG(INFO, tag, message, cause); 
	}
	
	public final static void w(final String tag, final String message, final Throwable cause){
		LOG(WARN, tag, message, cause); 
	}
	
	public final static void e(final String tag, final String message, final Throwable cause){
		LOG(ERROR, tag, message, cause); 
	}
	
	private final static void LOG(final int level,
			final String tag, final String message, final Throwable cause){
		switch(LEVEL){
		case DEBUG:
			log(level, tag, message, cause);
			break;
		case INFO :
			if(level < INFO){
				break;
			}
			log(level, tag, message, cause);
			break;
		case WARN :
			if(level < WARN){
				break;
			}
			log(level, tag, message, cause);
			break;
		case ERROR:
			if(level < ERROR){
				break;
			}
			log(level, tag, message, cause);
			break;
		}
	}
	
	private final static void log(final int level,
			final String tag, final String message, final Throwable cause){
		switch(level){
		case DEBUG:
		case INFO :
			doLog(System.out, tag, message, cause);
			break;
		case WARN :
		case ERROR:
			doLog(System.err, tag, message, cause);
			break;
		}
	}
	
	private final static void doLog(final PrintStream out,
			final String tag, final String message, final Throwable cause){
		final DateFormat df = new SimpleDateFormat(TMSFMT, Locale.US);
		final String tms = df.format(new Date());
		final String tn  = Thread.currentThread().getName();
		out.println(String.format(FORMAT, tms, tn, tag, message));
		if(cause != null){
			cause.printStackTrace(out);
		}
	}
	
}

