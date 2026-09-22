package com.archai.modulo.autenticacion.entidad;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "nombre_usuario", unique = true, length = 100)
    private String nombreUsuario;

    @Column(name = "correo", unique = true, nullable = false, length = 150)
    private String correo;

    @Column(name = "contrasena", nullable = false, length = 255)
    private String contrasena;

    @Column(name = "dni", unique = true, length = 20)
    private String dni;

    @Column(name = "rol", length = 80)
    @Builder.Default
    private String rol = "Desarrollador";

    @Column(name = "color_avatar", length = 20)
    @Builder.Default
    private String colorAvatar = "#2563EB";

    @Column(name = "es_anfitrion")
    @Builder.Default
    private Boolean esAnfitrion = false;

    /** CU-01 · Flujo alterno 3b: ACTIVO | BLOQUEADO | INACTIVO */
    @Column(name = "estado", length = 20)
    @Builder.Default
    private String estado = "ACTIVO";

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "ultimo_acceso")
    private LocalDateTime ultimoAcceso;

    @PrePersist
    public void alCrear() {
        if (this.fechaCreacion == null) this.fechaCreacion = LocalDateTime.now();
        if (this.ultimoAcceso == null) this.ultimoAcceso = LocalDateTime.now();
    }
}
