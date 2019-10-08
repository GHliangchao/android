package com.tuidian.tech.zma.lock.util;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class Md5PwdEncoder {
	
	// 简单的MD5加密
	public static String passwordEncode(String pass){
		MessageDigest messageDigest = getMessageDigest();
		byte[] digest;
		try {
			digest = messageDigest.digest(pass.getBytes("UTF-8"));
		} catch (UnsupportedEncodingException e) {
			throw new IllegalStateException("UTF-8 not supported!");
		}
		return new String(ByteUtil.hexString(digest));
	}

	protected static final MessageDigest getMessageDigest() {
		String algorithm = "MD5";
		try {
			return MessageDigest.getInstance(algorithm);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalArgumentException("No such algorithm ["
					+ algorithm + "]");
		}
	}

	@SuppressWarnings("static-access")
	public static void main(String[] args) {
		Md5PwdEncoder m = new Md5PwdEncoder();
		System.out.println(m.passwordEncode("111"));
	}
}
