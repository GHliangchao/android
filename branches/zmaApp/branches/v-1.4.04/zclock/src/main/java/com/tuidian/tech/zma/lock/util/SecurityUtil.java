package com.tuidian.tech.zma.lock.util;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;

import com.tuidian.tech.zma.lock.Consts;

/**
 * Security utils.
 * 
 * @author pzp@maihesoft.com
 * @since 2018年3月10日
 *
 */
public final class SecurityUtil {
	final static String TAG = "sec";
	final static String ENCODING = "UTF-8";
	
	private SecurityUtil(){
		
	}

	public final static String sha1Sign(final String rawKey, final String publicSeed) {
		Logger.debugf(TAG, "sha1Sign(): raw-key = %s, public-seed = %s", rawKey, publicSeed);
		String sign = null;
		try {
			final MessageDigest sha1 = sha1();
			// sha1(sha1(key))
			final byte[] hashStage1 = sha1.digest(rawKey.getBytes(ENCODING));
			sha1.reset();
			final byte[] hashStage2 = sha1.digest(hashStage1);
			sha1.reset();
			// do-sign
			sha1.update(ByteUtil.parsehex(publicSeed));
			sha1.update(hashStage2);
			// xor - signa ^ keyHashStage1
	        final byte[] signa = sha1.digest();
	        final int length = signa.length;
	        for (int i = 0; i < length; i++) {
	        	signa[i] = (byte) (signa[i] ^ hashStage1[i]);
	        }
	        sign = ByteUtil.dumphex(signa);
	        Logger.debugf(TAG, "sha1Sign(): sign = %s", sign);
		} catch (final UnsupportedEncodingException e) {
			// ignore - always support UTF-8 in java!
		}
		return sign;
	}
	
	public final static boolean sha1Verify(final byte[] reply, final byte[] hashStage2, final byte[] publicSeed){
		if(Consts.DEBUG){
			final String rep = ByteUtil.dumphex(reply);
			final String stage2 = ByteUtil.dumphex(hashStage2);
			final String seed= ByteUtil.dumphex(publicSeed);
			Logger.debugf(TAG, "sha1Sign(): reply = %s, hash-stage2 = %s, public-seed = %s", rep, stage2, seed);
		}
		final MessageDigest sha1 = sha1();
		// sha1(publicSeed, hashStage2)
		sha1.update(publicSeed);
		sha1.update(hashStage2);
		final byte[] hashStage1 = sha1.digest();
		sha1.reset();
		
		// xor(reply, sha1(publicSeed, hashStage2))
		final int length = hashStage1.length;
        for (int i = 0; i < length; i++) {
        	hashStage1[i] = (byte) (reply[i] ^ hashStage1[i]);
        }
        
        // candidateHash2
        final byte[] candidateHash2 = sha1.digest(hashStage1);
        
        // check EQ
        return (Arrays.equals(candidateHash2, hashStage2));
	}
	
	public final static byte[] sha1Key(final byte[] rawKey){
		final MessageDigest sha1 = sha1();
		// sha1(sha1(key))
		final byte[] hashStage1 = sha1.digest(rawKey);
		sha1.reset();
		final byte[] hashStage2 = sha1.digest(hashStage1);
		return hashStage2;
	}
	
	public final static String sha1Key(final String rawKey){
		String key = null;
		try{
			final byte[] keya = sha1Key(rawKey.getBytes(ENCODING));
			key = ByteUtil.dumphex(keya);
		} catch (final UnsupportedEncodingException e) {
			// ignore - always support UTF-8 in java!
		}
		return key;
	}
	
	public final static MessageDigest sha1(){
		try {
			return MessageDigest.getInstance("SHA-1");
		} catch (final NoSuchAlgorithmException e) {
			throw new RuntimeException(e);
		}
	}
	
	public final static byte[] aesEncrypt(final byte[] rawKey, final byte[] plain){
		return aesEncrypt(rawKey, plain, 0, plain.length);
	}
	
	public final static byte[] aesEncrypt(final byte[] rawKey, final byte[] plain, 
			                                   final int offset, final int length){
		return aesCodec(Cipher.ENCRYPT_MODE, rawKey, plain, offset, length);
	}
	
	public final static byte[] aesDecrypt(final byte[] rawKey, final byte[] cipher){
		return aesDecrypt(rawKey, cipher, 0, cipher.length);
	}
	
	public final static byte[] aesDecrypt(final byte[] rawKey, final byte[] cipher,
			                                    final int offset, final int length){
		return aesCodec(Cipher.DECRYPT_MODE, rawKey, cipher, offset, length);
	}
	
	final static byte[] aesCodec(final int mode, final byte[] rawKey, final byte[] input, 
			                                         final int offset, final int length){
		try{
			final SecretKeySpec keySpec = new SecretKeySpec(rawKey, "AES");
			final Cipher cipher = Cipher.getInstance("AES/ECB/NoPadding");
			cipher.init(mode, keySpec);
			final byte[] output = cipher.doFinal(input, offset, length);
			return output;
		}catch(final Exception e){
			Logger.debugf(TAG, "aesCodec(): error = %s", e);
			throw new RuntimeException(e);
		}
	}

}
