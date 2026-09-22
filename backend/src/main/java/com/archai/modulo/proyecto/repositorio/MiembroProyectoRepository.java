package com.archai.modulo.proyecto.repositorio;

import com.archai.modulo.proyecto.entidad.MiembroProyectoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MiembroProyectoRepository extends JpaRepository<MiembroProyectoEntity, String> {
    List<MiembroProyectoEntity> findByProyectoId(String proyectoId);
    Optional<MiembroProyectoEntity> findByProyectoIdAndUsuarioId(String proyectoId, String usuarioId);
    void deleteByProyectoIdAndUsuarioId(String proyectoId, String usuarioId);
    boolean existsByProyectoIdAndUsuarioId(String proyectoId, String usuarioId);
}
