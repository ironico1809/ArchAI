package com.archai.modulo.diagrama.entidad;

import com.archai.modulo.autenticacion.entidad.UsuarioEntity;
import com.archai.modulo.proyecto.entidad.ProyectoEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "diagramas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiagramaEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proyecto")
    private ProyectoEntity proyecto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_creador")
    private UsuarioEntity creador;

    @Column(name = "titulo", nullable = false, length = 200)
    private String titulo;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "json_diagrama", nullable = false, columnDefinition = "TEXT")
    private String jsonDiagrama;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @PrePersist
    public void alCrear() {
        if (this.fechaCreacion == null) this.fechaCreacion = LocalDateTime.now();
        if (this.fechaActualizacion == null) this.fechaActualizacion = LocalDateTime.now();
    }

    @PreUpdate
    public void alActualizar() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}
