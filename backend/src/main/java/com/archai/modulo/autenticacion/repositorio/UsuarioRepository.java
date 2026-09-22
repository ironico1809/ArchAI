package com.archai.modulo.autenticacion.repositorio;

import com.archai.modulo.autenticacion.entidad.UsuarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<UsuarioEntity, String> {
    Optional<UsuarioEntity> findByCorreoIgnoreCase(String correo);
    Optional<UsuarioEntity> findByNombreUsuarioIgnoreCase(String nombreUsuario);
    Optional<UsuarioEntity> findByDni(String dni);
    boolean existsByCorreoIgnoreCase(String correo);
    boolean existsByNombreUsuarioIgnoreCase(String nombreUsuario);
}
