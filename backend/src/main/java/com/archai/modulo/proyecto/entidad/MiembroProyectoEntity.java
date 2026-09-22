package com.archai.modulo.proyecto.entidad;

import com.archai.modulo.autenticacion.entidad.UsuarioEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "miembros_proyecto", uniqueConstraints = {
        @UniqueConstraint(name = "uq_proyecto_usuario", columnNames = {"id_proyecto", "id_usuario"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MiembroProyectoEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proyecto", nullable = false)
    private ProyectoEntity proyecto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private UsuarioEntity usuario;

    @Column(name = "rol_proyecto", length = 50)
    @Builder.Default
    private String rolProyecto = "EDITOR"; // PROPIETARIO, ADMINISTRADOR, EDITOR, LECTOR

    @Column(name = "fecha_agregado")
    private LocalDateTime fechaAgregado;

    @PrePersist
    public void alCrear() {
        if (this.fechaAgregado == null) this.fechaAgregado = LocalDateTime.now();
    }
}
