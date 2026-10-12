package com.nexfinance.app;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "NativeUpdater")
public class NativeUpdaterPlugin extends Plugin {
    private final ExecutorService downloadExecutor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String apkUrl = call.getString("url");
        String version = call.getString("version", "latest");
        String expectedSha256 = call.getString("sha256", "").toLowerCase(Locale.ROOT);

        if (!isTrustedApkUrl(apkUrl)) {
            call.reject("O link desta atualização não é um APK válido do GitHub.");
            return;
        }
        if (!expectedSha256.isEmpty() && !expectedSha256.matches("[a-f0-9]{64}")) {
            call.reject("Não foi possível validar a integridade do APK.");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("O app não está disponível para iniciar a atualização.");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            && !activity.getPackageManager().canRequestPackageInstalls()) {
            try {
                Intent settingsIntent = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + activity.getPackageName())
                );
                activity.startActivity(settingsIntent);
                JSObject result = new JSObject();
                result.put("status", "permission_required");
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Não foi possível abrir a permissão de instalação do Android.", error);
            }
            return;
        }

        String safeVersion = version.replaceAll("[^A-Za-z0-9._-]", "_");
        downloadExecutor.execute(() -> downloadAndOpenInstaller(
            activity, call, apkUrl, safeVersion, expectedSha256
        ));
    }

    private boolean isTrustedApkUrl(String value) {
        if (value == null) return false;
        try {
            URL url = new URL(value);
            return "https".equalsIgnoreCase(url.getProtocol())
                && "github.com".equalsIgnoreCase(url.getHost())
                && url.getPath().toLowerCase(Locale.ROOT).endsWith(".apk");
        } catch (Exception error) {
            return false;
        }
    }

    private void downloadAndOpenInstaller(
        Activity activity,
        PluginCall call,
        String apkUrl,
        String version,
        String expectedSha256
    ) {
        HttpURLConnection connection = null;
        File temporaryFile = null;

        try {
            File updateDirectory = new File(getContext().getFilesDir(), "updates");
            if (!updateDirectory.exists() && !updateDirectory.mkdirs()) {
                throw new Exception("Não foi possível preparar o espaço para a atualização.");
            }

            File apkFile = new File(updateDirectory, "nex-finance-" + version + ".apk");
            if (apkFile.isFile() && apkFile.length() > 0
                && hasExpectedDigest(apkFile, expectedSha256)) {
                openInstaller(activity, call, apkFile);
                return;
            }

            temporaryFile = new File(updateDirectory, apkFile.getName() + ".part");
            if (temporaryFile.exists() && !temporaryFile.delete()) {
                throw new Exception("Não foi possível preparar o download da atualização.");
            }

            connection = (HttpURLConnection) new URL(apkUrl).openConnection();
            connection.setConnectTimeout(20000);
            connection.setReadTimeout(30000);
            connection.setInstanceFollowRedirects(true);
            connection.setRequestProperty("Accept", "application/vnd.android.package-archive, application/octet-stream");

            int responseCode = connection.getResponseCode();
            if (responseCode < 200 || responseCode >= 300) {
                throw new Exception("O GitHub não conseguiu fornecer o APK (HTTP " + responseCode + ").");
            }
            if (!"https".equalsIgnoreCase(connection.getURL().getProtocol())) {
                throw new Exception("O download foi redirecionado para uma conexão insegura.");
            }

            long totalBytes = connection.getContentLengthLong();
            long receivedBytes = 0;
            long lastProgressTime = 0;
            int lastProgressValue = -1;
            byte[] buffer = new byte[32 * 1024];

            try (InputStream input = connection.getInputStream();
                 FileOutputStream output = new FileOutputStream(temporaryFile)) {
                int bytesRead;
                while ((bytesRead = input.read(buffer)) != -1) {
                    output.write(buffer, 0, bytesRead);
                    receivedBytes += bytesRead;
                    long now = System.currentTimeMillis();
                    int progress = totalBytes > 0
                        ? (int) Math.min(100, Math.round((receivedBytes * 100.0) / totalBytes))
                        : 0;
                    boolean shouldEmitProgress = totalBytes > 0
                        ? progress != lastProgressValue && (now - lastProgressTime >= 100 || progress == 100)
                        : now - lastProgressTime >= 100;
                    if (shouldEmitProgress) {
                        emitProgress(activity, receivedBytes, totalBytes);
                        lastProgressTime = now;
                        lastProgressValue = progress;
                    }
                }
                output.getFD().sync();
            }

            if (receivedBytes == 0) {
                throw new Exception("O arquivo de atualização recebido está vazio.");
            }
            if (!hasExpectedDigest(temporaryFile, expectedSha256)) {
                throw new Exception("A verificação de integridade do APK falhou. Tente novamente.");
            }

            if (apkFile.exists() && !apkFile.delete()) {
                throw new Exception("Não foi possível substituir o arquivo de atualização anterior.");
            }
            if (!temporaryFile.renameTo(apkFile)) {
                throw new Exception("Não foi possível finalizar o arquivo de atualização.");
            }

            emitProgress(activity, receivedBytes, receivedBytes);
            openInstaller(activity, call, apkFile);
        } catch (Exception error) {
            if (temporaryFile != null && temporaryFile.exists()) temporaryFile.delete();
            String message = error.getMessage() != null
                ? error.getMessage()
                : "Não foi possível baixar a atualização. Verifique sua conexão e tente novamente.";
            activity.runOnUiThread(() -> call.reject(message, error));
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private boolean hasExpectedDigest(File file, String expectedSha256) throws Exception {
        if (expectedSha256.isEmpty()) return true;

        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] buffer = new byte[32 * 1024];
        try (FileInputStream input = new FileInputStream(file)) {
            int bytesRead;
            while ((bytesRead = input.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
        }

        StringBuilder actualSha256 = new StringBuilder(64);
        for (byte value : digest.digest()) {
            actualSha256.append(String.format(Locale.ROOT, "%02x", value & 0xff));
        }
        return actualSha256.toString().equals(expectedSha256);
    }

    private void emitProgress(Activity activity, long receivedBytes, long totalBytes) {
        int progress = totalBytes > 0
            ? (int) Math.min(100, Math.round((receivedBytes * 100.0) / totalBytes))
            : 0;
        JSObject event = new JSObject();
        event.put("receivedBytes", receivedBytes);
        event.put("totalBytes", totalBytes);
        event.put("progress", progress);
        activity.runOnUiThread(() -> notifyListeners("downloadProgress", event));
    }

    private void openInstaller(Activity activity, PluginCall call, File apkFile) {
        activity.runOnUiThread(() -> {
            try {
                Uri apkUri = FileProvider.getUriForFile(
                    activity,
                    activity.getPackageName() + ".fileprovider",
                    apkFile
                );
                Intent installIntent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                installIntent.setClipData(ClipData.newUri(
                    activity.getContentResolver(), apkFile.getName(), apkUri
                ));
                activity.startActivity(installIntent);

                JSObject result = new JSObject();
                result.put("status", "installer_opened");
                call.resolve(result);
            } catch (Exception error) {
                call.reject("O APK foi baixado, mas o instalador do Android não pôde ser aberto.", error);
            }
        });
    }
}
