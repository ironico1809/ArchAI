package com.archai.modulo.diagrama.repositorio;

import com.archai.modulo.diagrama.entidad.ComentarioDiagramaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComentarioDiagramaRepository extends JpaRepository<ComentarioDiagramaEntity, String> {
    List<ComentarioDiagramaEntity> findByDiagramaIdOrderByFechaCreacionAsc(String diagramaId);
}
