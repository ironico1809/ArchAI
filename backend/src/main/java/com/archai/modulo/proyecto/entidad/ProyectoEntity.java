package com.archai.modulo.proyecto.entidad;

import com.archai.modulo.autenticacion.entidad.UsuarioEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "proyectos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProyectoEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "nombre", nullable = false, length = 200)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "codigo_acceso", unique = true, length = 50)
    private String codigoAcceso;

    @Column(name = "icono_color", length = 30)
    @Builder.Default
    private String iconoColor = "#3B82F6";

    @Column(name = "estado", length = 30)
    @Builder.Default
    private String estado = "ACTIVO";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_propietario")
    private UsuarioEntity propietario;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @OneToMany(mappedBy = "proyecto", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MiembroProyectoEntity> miembros = new ArrayList<>();

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
