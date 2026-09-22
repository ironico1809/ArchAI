package com.archai.modulo.diagrama.repositorio;

import com.archai.modulo.diagrama.entidad.DiagramaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiagramaRepository extends JpaRepository<DiagramaEntity, String> {
    List<DiagramaEntity> findByProyectoId(String proyectoId);
    List<DiagramaEntity> findByCreadorId(String creadorId);
    int countByProyectoId(String proyectoId);
}
