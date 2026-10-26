import com.android.apksig.ApkVerifier;
import java.io.File;
import java.security.MessageDigest;
import java.util.HexFormat;
class VerifyApk {
 public static void main(String[] args) throws Exception {
  var result=new ApkVerifier.Builder(new File(args[0])).build().verify();
  System.out.println("verified="+result.isVerified());
  System.out.println("v1="+result.isVerifiedUsingV1Scheme());
  System.out.println("v2="+result.isVerifiedUsingV2Scheme());
  System.out.println("v3="+result.isVerifiedUsingV3Scheme());
  for(var e:result.getErrors())System.out.println("error="+e);
  for(var w:result.getWarnings())System.out.println("warning="+w);
  for(var c:result.getSignerCertificates())System.out.println("certificate_sha256="+HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(c.getEncoded())));
  if(!result.isVerified())System.exit(2);
 }
}
