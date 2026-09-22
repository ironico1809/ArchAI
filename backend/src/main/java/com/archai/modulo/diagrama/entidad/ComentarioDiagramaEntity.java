package com.archai.modulo.diagrama.entidad;

import com.archai.modulo.autenticacion.entidad.UsuarioEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "comentarios_diagrama")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComentarioDiagramaEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_diagrama", nullable = false)
    private DiagramaEntity diagrama;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private UsuarioEntity usuario;

    @Column(name = "texto", nullable = false, columnDefinition = "TEXT")
    private String texto;

    @Column(name = "posicion_x")
    @Builder.Default
    private Double posicionX = 0.0;

    @Column(name = "posicion_y")
    @Builder.Default
    private Double posicionY = 0.0;

    @Column(name = "resuelto")
    @Builder.Default
    private Boolean resuelto = false;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @PrePersist
    public void alCrear() {
        if (this.fechaCreacion == null) this.fechaCreacion = LocalDateTime.now();
    }
}
