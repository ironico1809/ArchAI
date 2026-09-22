package com.archai.modulo.diagrama.entidad;

import com.archai.modulo.autenticacion.entidad.UsuarioEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "versiones_diagrama")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VersionDiagramaEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_diagrama", nullable = false)
    private DiagramaEntity diagrama;

    @Column(name = "numero_version", nullable = false)
    private Integer numeroVersion;

    @Column(name = "etiqueta", length = 100)
    private String etiqueta;

    @Column(name = "descripcion_cambio", columnDefinition = "TEXT")
    private String descripcionCambio;

    @Column(name = "json_diagrama", nullable = false, columnDefinition = "TEXT")
    private String jsonDiagrama;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_autor")
    private UsuarioEntity autor;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @PrePersist
    public void alCrear() {
        if (this.fechaCreacion == null) this.fechaCreacion = LocalDateTime.now();
    }
}
