package com.archai.modulo.generador.servicio;

import com.archai.modulo.diagrama.dto.DiagramDto;
import com.archai.modulo.generador.dto.GeneratedFileDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
public class ServicioExportacionZip {

    private final ServicioGeneradorSpringBoot generadorSpringBoot;
    private final ServicioGeneradorPostgresDdl generadorPostgresDdl;
    private final ServicioGeneradorPostman generadorPostman;
    private final ServicioXmi servicioXmi;

    public byte[] createProjectZip(DiagramDto diagram) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            List<GeneratedFileDto> springFiles = generadorSpringBoot.generateProjectFiles(diagram);
            for (GeneratedFileDto file : springFiles) {
                ZipEntry entry = new ZipEntry(file.getPath());
                zos.putNextEntry(entry);
                zos.write(file.getContent().getBytes(StandardCharsets.UTF_8));
                zos.closeEntry();
            }

            String ddl = generadorPostgresDdl.generateDdl(diagram);
            zos.putNextEntry(new ZipEntry("database/schema.sql"));
            zos.write(ddl.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            String postman = generadorPostman.generateCollectionJson(diagram);
            zos.putNextEntry(new ZipEntry("postman/collection.json"));
            zos.write(postman.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            String xmi = servicioXmi.exportXmi(diagram);
            zos.putNextEntry(new ZipEntry("uml/model.xmi"));
            zos.write(xmi.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }
        return baos.toByteArray();
    }
}
